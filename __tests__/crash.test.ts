// Note this is running from the build code
// Build with `npm run build` first
import { ElectronProcess } from "../lib";
import * as path from "path";

jest.setTimeout(process.env.CI ? 30_000 : 5_000);

describe("headless-electron", () => {
  it("handles crashes", async () => {
    const ep = new ElectronProcess();
    try {
      await expect(
        ep.runScript<number>({
          pathname: path.resolve(__dirname, "runScript-js.js"),
          functionName: "processCrash",
          args: [],
        })
      ).rejects.toMatchInlineSnapshot(`[RenderProcessGone: killed (2)]`);

      await expect(
        ep.runScript<number>({
          pathname: path.resolve(__dirname, "runScript-js.js"),
          functionName: "multiply",
          args: [2, 3],
        })
      ).resolves.toEqual(6);
    } finally {
      await ep.kill();
    }
  });
});
