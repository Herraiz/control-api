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
  coverageReporters: ["text", "html"],
  collectCoverageFrom: [
    "graphql/types/Queries/user/getAlerts.ts",
    "graphql/types/Queries/reports/getCashFlow.ts",
  ],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "jest.config.ts",
    "jest.setup.ts",
  ],
};

export default config;
