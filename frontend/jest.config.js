const path = require("path");

module.exports = {
  testEnvironment: "jsdom",
  setupFiles: [path.resolve(__dirname, "jest.setup.globals.js")],
  setupFilesAfterEnv: [path.resolve(__dirname, "jest.setup.afterenv.js")],
  collectCoverageFrom: [
    "**/*.js",
    "!**/node_modules/**",
    "!**/tests/**",      // keeps test files out of coverage
    "!config.example.js"
  ],
  coverageDirectory: path.resolve(__dirname, "coverage"),
  moduleFileExtensions: ["js", "json"]
};