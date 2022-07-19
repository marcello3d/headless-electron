import * as path from "path";
import { spawn } from "child_process";
import { uuid } from "./utils/uuid";
import {
  ProcessIpcOutputMessage,
  RunScriptEvent,
  RunScriptParams,
} from "./electron/shared";

const electronPath = require("electron") as unknown as string;

type Spawned = ReturnType<typeof spawn>;

export class ElectronProcess {
  private process: Promise<Spawned>;

  constructor(
    public readonly debugMode: boolean = false,
    public readonly concurrency: number = 1
  ) {}

  /**
   * get an idle electron with lock
   */
  private async getProcess(): Promise<Spawned> {
    if (!this.process) {
      this.process = this.create();
    }
    return this.process;
  }

  /**
   * create an idle electron proc
   */
  private async create(): Promise<Spawned> {
    return new Promise((resolve, reject) => {
      const args: string[] = [];
      if (process.env.HEADLESS_ELECTRON_NO_SANDBOX) {
        args.push("--no-sandbox");
      }
      if (process.env.HEADLESS_ELECTRON_STARTUP_ARGS) {
        args.push(...process.env.HEADLESS_ELECTRON_STARTUP_ARGS.split(/\s+/));
      }
      args.push(path.resolve(__dirname, "electron/main/index"));

      const proc = spawn(electronPath, args, {
        stdio: ["ipc", "pipe", "pipe"],
        env: {
          ...process.env,
          DEBUG_MODE: this.debugMode ? "true" : "",
          CONCURRENCY: `${this.concurrency}`,
        },
      });

      proc.on("error", reject);
      proc.on("close", () => {
        this.kill();
      });

      // send electron ready signal
      proc.once("message", (message: ProcessIpcOutputMessage) => {
        if (message.type !== "electron-ready") {
          reject(new Error(`unexpected message type ${message.type}`));
        }
        resolve(proc);
      });
    });
  }

  /**
   * kill all electron proc
   */
  public async kill(): Promise<void> {
    if (this.process) {
      const process = await this.process;
      process.kill();
      this.process = undefined;
    }
  }

  public async runScript(params: RunScriptParams): Promise<any> {
    const id = uuid();

    const proc = await this.getProcess();

    return new Promise((resolve, reject) => {
      function onMessage(message: ProcessIpcOutputMessage) {
        switch (message.type) {
          case "run-resolved":
            if (message.id === id) {
              resolve(message.value);
            }
            break;
          case "run-rejected":
            if (message.id === id) {
              reject(new Error(message.error));
            }
            break;
        }
      }

      function onClose() {
        reject(new Error("Electron process closed"));
        removeListeners();
      }

      function removeListeners() {
        proc.removeListener("message", onMessage);
        proc.removeListener("close", onClose);
      }

      // listen the running result
      proc.on("message", onMessage);
      proc.on("close", onClose);

      const message: RunScriptEvent = { id, type: "run-script", ...params };
      proc.send(message);
    });
  }
}
