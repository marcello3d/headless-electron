// We want console logging here for debugging purposes
/* eslint-disable no-console */

import { ipcRenderer } from "electron";
import {
  ElectronIpcRendererInputMessage,
  ElectronIpcRendererOutputMessage,
  RunScriptEvent,
} from "../shared";
import { makePlainError } from "../../utils/plain-error";

export type Args = {
  readonly debugMode?: boolean;
  readonly preloadRequire?: string;
};

// pass the args by url hash
let args: Args = {};

try {
  args = JSON.parse(decodeURIComponent(window.location.hash.slice(1)));
} catch (e) {
  console.error("🚨: could not read args", e);
}

const { debugMode = false, preloadRequire } = args;

if (debugMode) {
  console.log(`👏 headless-electron is Running...`);
}

let preloadError = undefined;

if (preloadRequire) {
  if (debugMode) {
    console.log(`📌 loading preloadRequire: ${preloadRequire}`);
  }
  try {
    require(preloadRequire);
  } catch (e) {
    preloadError = e;
    console.error(`🚨: could not load preload ${preloadRequire}:`, e);
  }
}

function send(channel: string, message: ElectronIpcRendererOutputMessage) {
  ipcRenderer.send(channel, message);
}

let currentAbortController: AbortController | undefined;

ipcRenderer.on(
  "message",
  async (event, message: ElectronIpcRendererInputMessage) => {
    switch (message.type) {
      case "abort-script":
        if (debugMode) {
          console.log(`🛑: [${message.id}] received abort!`);
        }
        currentAbortController?.abort();
        break;

      case "run-script":
        void runScript(message);
        break;
    }
  }
);

async function runScript({
  id,
  pathname,
  functionName,
  args,
  hasAbortSignal,
  hasStatusCallback,
}: RunScriptEvent) {
  try {
    if (debugMode) {
      console.log(`🍰: [${id}] running ${pathname}#${functionName}(${args})`);
    }
    if (preloadError) {
      throw preloadError;
    }
    currentAbortController = hasAbortSignal ? new AbortController() : undefined;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fn = require(pathname)[functionName];
    const value = await fn.apply(
      {
        abortSignal: currentAbortController?.signal,
        statusCallback: hasStatusCallback
          ? (status: unknown) => {
              send(id, { type: "run-status", id, status });
            }
          : undefined,
      },
      args
    );
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
      error: makePlainError(error),
    });
  } finally {
    currentAbortController = undefined;
  }
}
