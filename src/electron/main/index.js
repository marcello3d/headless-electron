try {
  require("ts-node/register/transpile-only");
} catch (e) {
  // issok
}

try {
  require("./main");
} catch (e) {
  console.error(e);
  process.exit(-1);
}
