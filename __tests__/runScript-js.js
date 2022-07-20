exports.default = function (input) {
  return input + 1;
};

exports.multiply = function (a, b) {
  return a * b;
};

exports.asyncMultiply = function (a, b) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(a * b), 100);
  });
};

exports.asyncCrash = function (input) {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error("async fail:" + input)), 100);
  });
};

exports.crashes = function (input) {
  throw new Error("fail: " + input);
};
