const { authenticate } = require('../middleware/authMiddleware');

describe('authenticate middleware', () => {
  const oldEnv = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...oldEnv, JWT_SECRET: 'test-secret' };
  });
  afterAll(() => {
    process.env = oldEnv;
  });

  test('returns 401 when Authorization header missing', () => {
    const req = { header: () => null };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test('returns 401 for invalid scheme', () => {
    const req = { header: () => 'Basic abc' };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    authenticate(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});


