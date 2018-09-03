module.exports = function(config) {
  config.set({
    testRunner: "jest",
    mutator: "javascript",
    transpilers: [],
    reporters: ["html", "baseline", "clear-text", "progress", "dashboard"],
    packageManager: "yarn",
    coverageAnalysis: "off",
    mutate: ["src/**/*.js"]
  });
};
