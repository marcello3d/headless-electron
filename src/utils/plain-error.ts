export type PlainError = {
  name: string;
  message: string;
  stack?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function makePlainError(error: any): PlainError {
  if (
    error &&
    typeof error === "object" &&
    ("message" in error || "name" in error)
  ) {
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
