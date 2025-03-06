import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
  testEnvironment: "node",
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
collectCoverage: true,
coverageReporters: ["json", "html"],
collectCoverageFrom: [
"**/*.{js,ts}",
"!**/*.d.ts",
"!**/node_modules/**",
"!**/dist/**",
"!**/coverage/**",
"!**/test/**",
"!**/__tests__/**",
"!**/__mocks__/**",
"!**/jest.config.ts",
"!**/jest.setup.ts"
],
coveragePathIgnorePatterns: [
"/node_modules/",
"/test/",
"/__tests__/",
"/dist/",
"/coverage/",
"jest.config.ts",
"jest.setup.ts"
],
};

export default config;
