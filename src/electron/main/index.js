function onError(error) {
  process.stderr.write(
    (error instanceof Error ? error.stack : `Uncaught error: ${error}`) + "\n"
  );
  process.exit(-1);
}
process.on("uncaughtException", onError);
process.on("unhandledRejection", onError);

require("./main");
