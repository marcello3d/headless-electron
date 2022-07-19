import { ipcRenderer } from "electron";
import { ElectronIpcRendererEvent, RunScriptEvent } from "../shared";

export type Args = {
  readonly debugMode?: boolean;
};

// pass the args by url hash
let args: Args = {};

try {
  args = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
} catch (e) {}

const debugMode = args.debugMode;

if (debugMode) {
  console.log(`👏 Jest-Electron is Running...`);
}

function send(channel: string, message: ElectronIpcRendererEvent) {
  ipcRenderer.send(channel, message);
}

ipcRenderer.on(
  "message",
  async (
    event,
    { id, pathname, functionName = "default", args = [] }: RunScriptEvent
  ) => {
    try {
      if (debugMode) {
        console.log(`🍰: [${id}] running ${pathname}#${functionName}(${args})`);
      }
      const value = await require(pathname)[functionName](...args);
      if (debugMode) {
        console.log(`🎸: [${id}] done`);
      }
      send(id, {
        type: "run-resolved",
        id,
        value,
      });
    } catch (error) {
      if (debugMode) {
        console.error(error);
      }
      send(id, {
        type: "run-rejected",
        id,
        error: error.message || error.toString(),
      });
    }
  }
);
