// Jest Setup für jsdom
// Hier können globale Mocks, Utilities, oder Initialierungen stattfinden

// LocalStorage Mock für Tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock;

// Optional: Plausible Analytics Stub
global.plausible = jest.fn();

// Console-Logs in Tests unterdrücken (Optional)
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});
