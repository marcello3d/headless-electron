import * as path from "path";
import * as url from "url";
import { BrowserWindow, ipcMain, RenderProcessGoneDetails } from "electron";
import { delay } from "../../utils/delay";
import { RunResultEvent, RunScriptEvent } from "../shared";

type Info = {
  win: BrowserWindow;
  idle: boolean;
};

/**
 * browser window (renderer) pool
 */
export class WindowPool {
  private pool: Info[] = [];

  // create new browser window instance lock flag
  private locked = false;

  constructor(
    private readonly maxSize: number,
    private readonly debugMode: boolean = false
  ) {}

  /**
   * get a window with thread lock
   */
  private async getIdleWindow(): Promise<BrowserWindow> {
    // if locked, delay and retry
    if (this.locked) {
      await delay();
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
    // find an idle window
    const info = this.pool.find((info) => info.idle);

    if (info) {
      return info.win;
    }

    // no available windows, wait...
    if (this.isFull()) {
      await delay();
      return await this.getAsync();
    }

    const win = await this.create();
    this.pool.push({ win, idle: true });
    return win;
  }

  /**
   * create a valid electron browser window
   */
  private async create(): Promise<BrowserWindow> {
    return new Promise((resolve, reject) => {
      let win = new BrowserWindow({
        width: 800,
        height: 600,
        show: this.debugMode,
        focusable: this.debugMode,
        webPreferences: {
          webSecurity: false,
          nodeIntegration: true,
          contextIsolation: false,
        },
      });

      // after window closed, remove it from pool for gc
      win.on("closed", () => {
        this.removeWin(win);
        win = undefined;
      });

      const fileUrl = url.format({
        hash: encodeURIComponent(JSON.stringify({ debugMode: this.debugMode })),
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
        // win ready
        resolve(win);
      });
    });
  }

  /**
   * the proc size of pool
   */
  public size() {
    return this.pool.length;
  }

  /**
   * whether the pool is full
   */
  public isFull() {
    return this.size() >= this.maxSize;
  }

  /**
   * set the proc idle status
   * @param win
   * @param idle
   */
  private setIdle(win: BrowserWindow, idle: boolean) {
    const idx = this.pool.findIndex((info) => info.win === win);

    this.pool[idx].idle = idle;
  }

  private removeWin(win: BrowserWindow) {
    const idx = this.pool.findIndex((info) => (info.win = win));

    // remove from pool by index
    if (idx !== -1) {
      this.pool.splice(idx, 1);
    }

    win.destroy();
  }

  /**
   * run test case by send it to renderer
   */
  public async runScript(params: RunScriptEvent): Promise<RunResultEvent> {
    const idleWindow = await this.getIdleWindow();
    return await this.runScriptOnWindow(idleWindow, params);
  }

  private async runScriptOnWindow(
    win: BrowserWindow,
    params: RunScriptEvent
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      this.setIdle(win, false);

      const cleanup = () => {
        ipcMain.removeListener(params.id, onResult);
        win.webContents.removeListener("render-process-gone", onError);
        this.setIdle(win, true);
      };

      function onResult(event, result: RunResultEvent) {
        cleanup();
        resolve(result);
      }

      ipcMain.once(params.id, onResult);

      function onError(event, details: RenderProcessGoneDetails) {
        cleanup();
        win.close();
        reject(
          new Error(`run script error: ${details.reason} (${details.exitCode})`)
        );
      }
      // send test case into web contents for running
      win.webContents.on("render-process-gone", onError);
      win.webContents.send("message", params);
    });
  }
}
