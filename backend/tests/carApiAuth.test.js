jest.mock('axios', () => ({ post: jest.fn(), get: jest.fn() }));
jest.mock('jsonwebtoken', () => ({ decode: jest.fn(() => ({ exp: Math.floor(Date.now() / 1000) + 300 })) }));
const axios = require('axios');

describe('carApiAuth service', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NODE_ENV: 'test', TEST_CARAPI_JWT: 'abc' };
    axios.post.mockReset();
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('fetches and caches JWT', async () => {
    let getAuthHeader;
    jest.isolateModules(() => {
      ({ getAuthHeader } = require('../services/carApiAuth'));
    });

    const first = await getAuthHeader();
    expect(first).toEqual({ Authorization: 'Bearer abc' });

    // Second call should not call axios (uses cached TEST_CARAPI_JWT)
    const second = await getAuthHeader();
    expect(axios.post).toHaveBeenCalledTimes(0);
    expect(second).toEqual({ Authorization: 'Bearer abc' });
  });

  test('throws on missing env', async () => {
    process.env = { ...OLD_ENV }; // remove test injection
    const { getAuthHeader } = require('../services/carApiAuth');
    await expect(getAuthHeader()).rejects.toThrow();
  });
});


