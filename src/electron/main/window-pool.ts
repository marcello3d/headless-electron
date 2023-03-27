import * as path from "path";
import * as url from "url";
import { BrowserWindow, ipcMain, RenderProcessGoneDetails } from "electron";
import { delay } from "../../utils/delay";
import {
  ElectronIpcRendererInputMessage,
  HeadlessElectronOptions,
  ProcessIpcOutputMessage,
  RunResultEvent,
  RunScriptEvent,
} from "../shared";
import { makePlainError } from "../../utils/plain-error";

/**
 * browser window (renderer) pool
 */
export class WindowPool {
  private readonly idlePool = new Set<BrowserWindow>();
  private readonly activePool = new Map<string, BrowserWindow>();
  private readonly debugMode: boolean;
  private readonly preloadRequire?: string;
  private readonly maxConcurrency: number;

  // create new browser window instance lock flag
  private locked = false;

  constructor({
    debugMode,
    minConcurrency,
    maxConcurrency,
    preloadRequire,
  }: HeadlessElectronOptions) {
    this.debugMode = debugMode;
    this.maxConcurrency = maxConcurrency;
    this.preloadRequire = preloadRequire;
    for (let i = 0; i < minConcurrency; i++) {
      void this.create();
    }
  }

  /**
   * get a window with thread lock
   */
  private async getIdleWindow(): Promise<BrowserWindow> {
    // if locked, delay and retry
    if (this.locked) {
      await delay(200);
      return await this.getIdleWindow();
    }

    this.locked = true;

    const win = await this.getAsync();

    this.locked = false;

    return win;
  }

  /**
   * get a window from pool, if not exist, create one, if pool is full, wait and retry
   */
  private async getAsync(): Promise<BrowserWindow> {
    // get first idle window by iterating over values and returning first one
    for (const win of this.idlePool) {
      return win;
    }

    // no available windows, wait...
    if (this.isFull()) {
      await delay(200);
      return await this.getAsync();
    }

    return await this.create();
  }

  /**
   * create a valid electron browser window
   */
  private async create(): Promise<BrowserWindow> {
    return new Promise((resolve, reject) => {
      const win: BrowserWindow = new BrowserWindow({
        width: 800,
        height: 600,
        show: this.debugMode,
        focusable: this.debugMode,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          nodeIntegrationInWorker: true,
          contextIsolation: false,
        },
      });

      const fileUrl = url.format({
        hash: encodeURIComponent(
          JSON.stringify({
            debugMode: this.debugMode,
            preloadRequire: this.preloadRequire,
          })
        ),
        pathname: path.join(__dirname, "/index.html"),
        protocol: "file:",
        slashes: true,
      });
      win.loadURL(fileUrl);

      if (this.debugMode) {
        // when debug mode, open dev tools
        win.webContents.openDevTools();
      }

      win.webContents.once("did-finish-load", () => {
        if (win) {
          this.idlePool.add(win);
          resolve(win);
        }
      });
      win.webContents.once(
        "did-fail-load",
        (event, errorCode, errorDescription) => {
          reject(new Error(`did-fail-load (${errorCode}: ${errorDescription}`));
        }
      );
    });
  }

  /**
   * the proc size of pool
   */
  public size() {
    return this.idlePool.size + this.activePool.size;
  }

  /**
   * whether the pool is full
   */
  public isFull() {
    return this.size() >= this.maxConcurrency;
  }
  private retainWin(id: string, win: BrowserWindow) {
    this.idlePool.delete(win);
    this.activePool.set(id, win);
  }

  private releaseWin(id: string, win: BrowserWindow) {
    this.activePool.delete(id);
    this.idlePool.add(win);
  }

  private removeWin(win: BrowserWindow) {
    for (const [id, w] of this.activePool) {
      if (w === win) {
        this.activePool.delete(id);
        break;
      }
    }
    this.idlePool.delete(win);
    win.destroy();
  }

  /**
   * run test case by send it to renderer
   */
  public runScript(
    params: RunScriptEvent,
    processSend: (message: ProcessIpcOutputMessage) => void
  ): void {
    this.getIdleWindow()
      .then((win) => this.runScriptOnWindow(win, params, processSend))
      .catch((e) => {
        processSend({
          type: "run-rejected",
          id: params.id,
          error: makePlainError(e),
        });
      });
  }

  private runScriptOnWindow(
    win: BrowserWindow,
    event: RunScriptEvent,
    processSend: (message: ProcessIpcOutputMessage) => void
  ): void {
    let resolved = false;
    const id = event.id;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    this.retainWin(id, win);

    const cleanup = () => {
      resolved = true;
      ipcMain.removeListener(id, onResult);
      win.webContents.removeListener("render-process-gone", onError);
      this.releaseWin(id, win);
    };

    function onResult(event, message: RunResultEvent) {
      if (!resolved) {
        processSend(message);
      }

      switch (message.type) {
        case "test-crash":
          win.webContents.forcefullyCrashRenderer();
          break;
        case "run-resolved":
        case "run-rejected":
          cleanup();
          break;
      }
    }

    ipcMain.on(id, onResult);

    function onError(event, details: RenderProcessGoneDetails) {
      if (!resolved) {
        processSend({
          type: "run-rejected",
          id,
          error: {
            name: "RenderProcessGone",
            message: `${details.reason} (${details.exitCode})`,
          },
        });
      }
      cleanup();
      self.removeWin(win);
    }
    // send test case into web contents for running
    win.webContents.on("render-process-gone", onError);
    win.webContents.send("message", event);
  }

  handle(
    message: ElectronIpcRendererInputMessage,
    processSend: (message: ProcessIpcOutputMessage) => void
  ) {
    switch (message.type) {
      case "run-script":
        this.runScript(message, processSend);
        break;

      case "abort-script":
        this.activePool.get(message.id)?.webContents.send("message", message);
        break;
    }
  }
}
