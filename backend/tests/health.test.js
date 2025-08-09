const request = require('supertest');
const app = require('../app');

describe('Health endpoint', () => {
  it('GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ status: 'OK' });
  });
});


