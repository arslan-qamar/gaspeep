module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['@testing-library/jest-dom', '<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  globals: {
    'import.meta': {
      env: {
        VITE_API_URL: process.env.VITE_API_URL || '',
      },
    },
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['babel-jest', {
      presets: ['@babel/preset-typescript', '@babel/preset-react'],
      plugins: [
        ['@babel/plugin-transform-runtime'],
      ],
    }],
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx|js)'],
};
