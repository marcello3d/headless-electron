function onError(error) {
  process.stderr.write(
    (error instanceof Error ? error.stack : `Uncaught error: ${error}`) + "\n"
  );
  process.send({ type: "fatal", error: String(error) });
  process.exit(-1);
}
process.on("uncaughtException", onError);
process.on("unhandledRejection", onError);

require("./main");
