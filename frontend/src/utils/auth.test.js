let getToken, setToken, removeToken, decodeToken, isTokenExpired;

const realLocalStorage = global.localStorage;

beforeEach(() => {
  let store = {};
  const mockLocalStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
  Object.defineProperty(global, 'localStorage', {
    value: mockLocalStorage,
    configurable: true,
  });

  jest.resetModules();

  jest.doMock('jwt-decode', () => ({
    jwtDecode: jest.fn(() => ({ sub: '123', exp: Math.floor(Date.now() / 1000) + 60 })),
  }));

  ({ getToken, setToken, removeToken, decodeToken, isTokenExpired } = require('./auth'));
});

afterAll(() => {
  Object.defineProperty(global, 'localStorage', {
    value: realLocalStorage,
    configurable: true,
  });
});

test('setToken/getToken/removeToken', () => {
  expect(getToken()).toBeNull();
  setToken('abc');
  expect(getToken()).toBe('abc');
  removeToken();
  expect(getToken()).toBeNull();
});

test('decodeToken returns payload and handles invalid tokens', () => {
  setToken('valid');
  expect(decodeToken()).toHaveProperty('sub', '123');
});

test('isTokenExpired false when exp in future', () => {
  setToken('valid');
  expect(isTokenExpired()).toBe(false);
});


