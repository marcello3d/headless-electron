// Note this is running from the build code
// Build with `npm run build` first
import { ElectronProcess } from "../lib";
import * as path from "path";
import { delay } from "../src/utils/delay";

jest.setTimeout(process.env.CI ? 30_000 : 5_000);

describe("headless-electron", () => {
  it("runs webgl script", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-webgl.ts"),
        args: [],
      });
      // eslint-disable-next-line no-console
      console.log(result);
      expect(result).toHaveLength(21);
    } finally {
      await ep.kill();
    }
  });
});
