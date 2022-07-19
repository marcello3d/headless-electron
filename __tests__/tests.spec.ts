import { ElectronProcess } from "../src";
import * as path from "path";

jest.setTimeout(10_000);

describe("headless-electron", () => {
  it("runs default script", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript({
        pathname: path.resolve(__dirname, "javascript.js"),
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
      const result = await ep.runScript({
        pathname: path.resolve(__dirname, "javascript.js"),
        functionName: "multiply",
        args: [2, 3],
      });
      expect(result).toBe(6);
    } finally {
      await ep.kill();
    }
  });
  it("runs default typescript function", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript({
        pathname: path.resolve(__dirname, "typescript.ts"),
        args: [1],
      });
      expect(result).toBe(2);
    } finally {
      await ep.kill();
    }
  });

  it("runs named typescript function", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript({
        pathname: path.resolve(__dirname, "typescript.ts"),
        functionName: "multiply",
        args: [2, 3],
      });
      expect(result).toBe(6);
    } finally {
      await ep.kill();
    }
  });
  it("generates canvas image", async () => {
    const ep = new ElectronProcess();
    try {
      const result = await ep.runScript({
        pathname: path.resolve(__dirname, "typescript.ts"),
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
});
