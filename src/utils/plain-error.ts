export type PlainError = {
  name: string;
  message: string;
  stack?: string;
};

export function makePlainError(error: any): PlainError {
  if (typeof error === "object" && ("message" in error || "name" in error)) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }
  return {
    name: "UnknownError",
    message: String(error),
  };
}
