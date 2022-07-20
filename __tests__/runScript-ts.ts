import { delay } from "../src/utils/delay";

export default function addOne(input) {
  return input + 1;
}

export function multiply(a, b) {
  return a * b;
}

export function canvasDrawRectToPng() {
  const canvas = document.createElement("canvas");
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0, 0, 50, 50);
  }
  return canvas.toDataURL();
}

export async function statusCallback(this: {
  statusCallback?: (status: any) => void;
}) {
  for (let i = 0; i < 10; i++) {
    await delay(10);
    this.statusCallback?.(i);
  }
}
export function abortable(this: { abortSignal?: AbortSignal }) {
  return new Promise((resolve, reject) => {
    this.abortSignal?.addEventListener("abort", () => {
      reject(new Error("caught abort event"));
    });
    setTimeout(() => {
      resolve(1);
    }, 1_000);
  });
}
