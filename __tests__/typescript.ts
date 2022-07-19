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
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(0, 0, 50, 50);
  return canvas.toDataURL();
}
