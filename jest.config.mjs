import nextJest from "next/jest.js";
export default nextJest({ dir: "./" })({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/$1" },
  testPathIgnorePatterns: ["/node_modules/", "/.next/", "/tests/browser/"],
});
