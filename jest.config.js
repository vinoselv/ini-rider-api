module.exports = {
    verbose: true,
    setupFiles: ["dotenv/config"],
    preset: "ts-jest",
    testEnvironment: "<rootDir>/__tests__/TestEnvironment.test.ts",
    testRunner: "jest-circus/runner",
    testTimeout: 50000,
    roots: ["<rootDir>/__tests__"],
    testRegex: "(__tests__/.*|(\\.|/)(test|spec))\\.tsx?$",
    reporters: [
        "default",
        [
            "jest-junit",
            {
                usePathForSuiteName: true,
                outputDirectory: "test_reports",
                outputName: "jest-junit.xml",
            },
        ],
    ],
    coverageDirectory: "test_reports",
    coverageReporters: ["text", "cobertura"],
    collectCoverageFrom: [
        "api/**/*.{js,jsx,ts,tsx}",
        "!api/**/*.d.ts",
        "!<rootDir>/node_modules/",
    ],
    testPathIgnorePatterns: ["TestUtils", "EventGenerator.ts"],
    globals: {
        'ts-jest': {
            isolatedModules: true
        }
    },
    maxWorkers: 4
};
