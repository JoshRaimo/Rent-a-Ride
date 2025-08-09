const request = require('supertest');
const app = require('../app');

describe('Auth routes basic checks', () => {
  it('GET /api/auth responds', async () => {
    const res = await request(app).get('/api/auth');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message');
  });
});


