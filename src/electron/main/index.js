try {
  require("ts-node/register");
} catch (e) {
  // issok
}

try {
  require("./main");
} catch (e) {
  console.error(e);
  process.exit(-1);
}
