// Note this is running from the build code
// Build with `npm run build` first
import { ElectronProcess } from "../lib";
import * as path from "path";

jest.setTimeout(process.env.CI ? 120_000 : 5_000);

describe("headless-electron", () => {
  it("runs webgl script", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const log = await ep.runScript<string[]>({
        pathname: path.resolve(__dirname, "runScript-webgl.ts"),
        args: [],
      });
      // eslint-disable-next-line no-console
      console.log(log);
      expect(log.find((line) => /WebGL Version/.test(line))).toBeDefined();
      expect(log.find((line) => /Done/.test(line))).toBeDefined();
    } finally {
      await ep.kill();
    }
  });
});
