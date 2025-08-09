jest.mock('axios', () => ({
  create: () => ({
    get: jest.fn(async () => ({ data: { items: [] } })),
    interceptors: { request: { use: jest.fn() } },
  }),
}));

describe('carApi service', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, CAR_API_KEY: 'key' };
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  test('fetchCarMakes returns data', async () => {
    const { fetchCarMakes } = require('../services/carApi');
    const data = await fetchCarMakes(1, 5);
    expect(data).toEqual({ items: [] });
  });
});


