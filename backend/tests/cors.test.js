const request = require('supertest');
const app = require('../app');

describe('CORS headers', () => {
  it('allows requests from configured origin', async () => {
    const origin = 'http://localhost:3000';
    const res = await request(app).get('/health').set('Origin', origin);
    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
  });
});


