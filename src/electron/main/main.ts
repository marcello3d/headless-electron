import { app } from "electron";
import { WindowPool } from "./window-pool";
import {
  HeadlessElectronOptions,
  ProcessIpcInputMessage,
  ProcessIpcOutputMessage,
} from "../shared";

const options = JSON.parse(
  process.env.HEADLESS_ELECTRON_OPTIONS ?? "{}"
) as HeadlessElectronOptions;

if (!options.debugMode) {
  app.dock?.hide();
}

app.on("window-all-closed", () => {
  app.quit();
});

function send(message: ProcessIpcOutputMessage) {
  try {
    process.send?.(message);
  } catch (e) {
    process.stderr.write(e.stack);
    process.exit(-1);
  }
}

app.on("ready", () => {
  // create a window pool instance
  const windowPool = new WindowPool(options);

  // redirect the test cases data, and redirect test result after running in electron
  process.on("message", (message: ProcessIpcInputMessage) => {
    windowPool.handle(message, send);
  });

  send({ type: "electron-ready" });
});
