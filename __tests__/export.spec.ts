import { ElectronProcess } from "../lib";
import * as path from "path";

jest.setTimeout(10_000);

describe("headless-electron", () => {
  it("runs default script", async () => {
    const ep = new ElectronProcess();
    const result = await ep.runScript({
      pathname: path.resolve(__dirname, "script.js"),
      args: [1],
    });
    expect(result).toBe(2);
    await ep.kill();
  });
  it("runs named script", async () => {
    const ep = new ElectronProcess();
    const result = await ep.runScript({
      pathname: path.resolve(__dirname, "script.js"),
      functionName: "multiply",
      args: [2, 3],
    });
    expect(result).toBe(6);
    await ep.kill();
  });
});
