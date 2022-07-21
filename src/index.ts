import * as path from "path";
import { spawn } from "child_process";
import { uuid } from "./utils/uuid";
import {
  ProcessIpcInputMessage,
  ProcessIpcOutputMessage,
  RunResultEvent,
} from "./electron/shared";

const electronPath = require("electron") as unknown as string;

type SpawnProcess = ReturnType<typeof spawn>;

export class ElectronProcess {
  private process: SpawnProcess | undefined;
  private ready = false;
  private readyPromise: Promise<void>;
  private readonly debugMode: boolean;
  private readonly minConcurrency: number;
  private readonly maxConcurrency: number;

  private readonly scriptHandlers = new Map<
    string,
    (event: RunResultEvent) => void
  >();

  constructor({
    debugMode = false,
    minConcurrency = 0,
    maxConcurrency = 1,
  }: {
    debugMode?: boolean;
    minConcurrency?: number;
    maxConcurrency?: number;
    requires?: string[];
  } = {}) {
    if (minConcurrency > maxConcurrency) {
      throw new Error(
        '"minConcurrency" must be less than or equal to "maxConcurrency"'
      );
    }
    this.debugMode = debugMode;
    this.minConcurrency = minConcurrency;
    this.maxConcurrency = maxConcurrency;
    this.process = this.spawnElectron();
  }

  private spawnElectron(): SpawnProcess {
    const args: string[] = [];
    if (process.env.HEADLESS_ELECTRON_NO_SANDBOX) {
      args.push("--no-sandbox");
    }
    if (process.env.HEADLESS_ELECTRON_STARTUP_ARGS) {
      args.push(...process.env.HEADLESS_ELECTRON_STARTUP_ARGS.split(/\s+/));
    }
    args.push(path.resolve(__dirname, "electron/main/index"));

    const proc = spawn(electronPath, args, {
      stdio: ["ipc", "inherit", "inherit"],
      env: {
        ...process.env,
        DEBUG_MODE: this.debugMode ? "true" : "",
        MIN_CONCURRENCY: String(this.minConcurrency),
        MAX_CONCURRENCY: String(this.maxConcurrency),
      },
    });
    proc.on("close", (code) => this.kill(`exited (${code})`));
    proc.on("error", (error) => this.kill(String(error)));
    proc.on("message", (message: ProcessIpcOutputMessage) => {
      switch (message.type) {
        case "run-resolved":
        case "run-rejected":
        case "run-status":
          this.scriptHandlers.get(message.id)?.(message);
          break;

        case "fatal":
          void this.kill(message.error);
          break;
      }
    });

    this.readyPromise = new Promise((resolve, reject) => {
      proc.on("error", reject);
      proc.once("message", (message: ProcessIpcOutputMessage) => {
        switch (message.type) {
          case "electron-ready":
            this.ready = true;
            resolve();
            break;
          case "run-resolved":
          case "run-status":
          case "run-rejected":
            reject(new Error(`unexpected ${message.type} message`));
            break;
          case "fatal":
            reject(new Error(`fatal error ${message.error}`));
            break;
        }
      });
    });
    return proc;
  }

  /**
   * kill all electron proc
   */
  public async kill(message: string = "closed"): Promise<void> {
    for (const [id, fn] of this.scriptHandlers.entries()) {
      fn({ type: "run-rejected", id, error: `process killed: ${message}` });
    }
    if (this.process) {
      this.process.kill();
      this.process = undefined;
    }
  }

  /**
   * Run a script in electron renderer process
   */
  public async runScript<Status = any>({
    pathname,
    functionName = "default",
    args = [],
    statusCallback,
    signal,
  }: {
    pathname: string;
    functionName?: string;
    args?: any[];
    statusCallback?: (status: Status) => void;
    signal?: AbortSignal;
  }): Promise<any> {
    const id = uuid();

    const proc = this.process;

    if (!proc) {
      throw new Error("electron process lost");
    }

    return new Promise(async (resolve, reject) => {
      this.scriptHandlers.set(id, (event: RunResultEvent) => {
        if (signal?.aborted) {
          this.scriptHandlers.delete(id);
          reject(new Error("script aborted"));
          return;
        }
        switch (event.type) {
          case "run-status":
            statusCallback?.(event.status);
            break;

          case "run-resolved":
            resolve(event.value);
            this.scriptHandlers.delete(id);
            break;

          case "run-rejected":
            reject(event.error);
            this.scriptHandlers.delete(id);
            break;
        }
      });

      await this.readyPromise;

      this.send({
        id,
        type: "run-script",
        pathname,
        functionName,
        args,
        hasStatusCallback: !!statusCallback,
        hasAbortSignal: !!signal,
      });

      signal?.addEventListener("abort", () => {
        this.send({ id, type: "abort-script" });
      });
    });
  }

  private send(message: ProcessIpcInputMessage): void {
    if (!this.process) {
      throw new Error("electron process lost");
    }
    this.process.send(message);
  }
}
