import { app } from "electron";
import { WindowPool } from "./window-pool";
import { ProcessIpcInputMessage, ProcessIpcOutputMessage } from "../shared";

const debugMode = !!process.env.DEBUG_MODE;
const concurrency = Number(process.env.CONCURRENCY);

app.on("window-all-closed", () => {
  app.quit();
});

function send(message: ProcessIpcOutputMessage) {
  process.send(message);
}

app.on("ready", () => {
  // create a window pool instance
  const windowPool = new WindowPool(concurrency, debugMode);

  // redirect the test cases data, and redirect test result after running in electron
  process.on("message", (params: ProcessIpcInputMessage) => {
    if (params.type === "run-script") {
      windowPool.runScript(params).then(send);
    } else {
      console.warn(`unknown message type: ${params.type}`);
    }
  });

  send({ type: "electron-ready" });
});
