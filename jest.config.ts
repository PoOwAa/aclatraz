import type { Config } from '@jest/types';

export default async (): Promise<Config.InitialOptions> => {
  return {
    preset: 'ts-jest',
    modulePathIgnorePatterns: ['<rootDir>/lib/'],
    testEnvironment: 'node',
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageThreshold: {
      global: {
        branches: 100,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  };
};
