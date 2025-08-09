const request = require('supertest');
const app = require('../app');

describe('Auth validation', () => {
  test('POST /api/auth/register with empty body returns 400', async () => {
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(Array.isArray(res.body.errors)).toBe(true);
  });

  test('POST /api/auth/login with empty body returns 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
  });

  test('GET /api/auth/unknown returns 404 handler', async () => {
    const res = await request(app).get('/api/auth/unknown');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ error: 'Auth route not found' });
  });
});


