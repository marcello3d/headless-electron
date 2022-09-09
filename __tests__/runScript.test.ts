// Note this is running from the build code
// Build with `npm run build` first
import { ElectronProcess } from "../lib";
import * as path from "path";
import { delay } from "../src/utils/delay";

jest.setTimeout(process.env.CI ? 30_000 : 5_000);

describe("headless-electron", () => {
  it("runs default script", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-js.js"),
        args: [1],
      });
      expect(result).toBe(2);
    } finally {
      await ep.kill();
    }
  });

  it("runs named script", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-js.js"),
        functionName: "multiply",
        args: [2, 3],
      });
      expect(result).toBe(6);
    } finally {
      await ep.kill();
    }
  });

  it("runs async script", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-js.js"),
        functionName: "asyncMultiply",
        args: [2, 3],
      });
      expect(result).toBe(6);
    } finally {
      await ep.kill();
    }
  });

  it("rejects with thrown error", async () => {
    const ep = new ElectronProcess();
    try {
      await expect(
        ep.runScript({
          pathname: path.resolve(__dirname, "runScript-js.js"),
          functionName: "crashes",
          args: ["hello"],
        })
      ).rejects.toMatchInlineSnapshot(`[Error: fail: hello]`);
    } finally {
      await ep.kill();
    }
  });

  it("rejects with async promise rejection", async () => {
    const ep = new ElectronProcess();
    try {
      await expect(
        ep.runScript({
          pathname: path.resolve(__dirname, "runScript-js.js"),
          functionName: "asyncCrash",
          args: ["hello"],
        })
      ).rejects.toMatchInlineSnapshot(`[Error: async fail:hello]`);
    } finally {
      await ep.kill();
    }
  });

  it("handles error in preload", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-error.js"),
    });
    try {
      await expect(
        ep.runScript<number>({
          pathname: path.resolve(__dirname, "runScript-js.js"),
          functionName: "multiply",
          args: [2, 3],
        })
      ).rejects.toMatchInlineSnapshot(`[Error: oops]`);
    } finally {
      await ep.kill();
    }
  });

  it("runs default typescript function", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-ts.ts"),
        args: [1],
      });
      expect(result).toBe(2);
    } finally {
      await ep.kill();
    }
  });

  it("runs named typescript function", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const result = await ep.runScript<number>({
        pathname: path.resolve(__dirname, "runScript-ts.ts"),
        functionName: "multiply",
        args: [2, 3],
      });
      expect(result).toBe(6);
    } finally {
      await ep.kill();
    }
  });

  it("generates canvas image", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const result = await ep.runScript<string>({
        pathname: path.resolve(__dirname, "runScript-ts.ts"),
        functionName: "canvasDrawRectToPng",
      });
      const dataImagePngBase64 = "data:image/png;base64,";
      expect(result.slice(0, dataImagePngBase64.length)).toEqual(
        dataImagePngBase64
      );
    } finally {
      await ep.kill();
    }
  });

  it("supports aborting", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const controller = new AbortController();
      const promise = ep.runScript({
        pathname: path.resolve(__dirname, "runScript-ts.ts"),
        functionName: "abortable",
        signal: controller.signal,
      });
      await delay(10);
      controller.abort();
      await expect(promise).rejects.toMatchInlineSnapshot(
        `[Error: script aborted]`
      );
    } finally {
      await ep.kill();
    }
  });

  it("supports status callbacks", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
    });
    try {
      const statuses: number[] = [];
      await ep.runScript<void, number>({
        pathname: path.resolve(__dirname, "runScript-ts.ts"),
        functionName: "statusCallback",
        statusCallback: (status) => statuses.push(status),
      });
      expect(statuses).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    } finally {
      await ep.kill();
    }
  });

  it("runs 100 times in a loop", async () => {
    const ep = new ElectronProcess({
      preloadRequire: path.resolve(__dirname, "preload-typescript.js"),
      maxConcurrency: 10,
    });
    try {
      const promises: Promise<number>[] = [];
      const expectedResults: number[] = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          ep.runScript<number>({
            pathname: path.resolve(__dirname, "runScript-ts.ts"),
            functionName: "multiply",
            args: [i, 3],
          })
        );
        expectedResults.push(i * 3);
      }
      const results = await Promise.all(promises);
      expect(results).toEqual(expectedResults);
    } finally {
      await ep.kill();
    }
  });
});
