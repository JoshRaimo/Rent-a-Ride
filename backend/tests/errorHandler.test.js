const express = require('express');
const request = require('supertest');
const errorHandler = require('../middleware/errorHandler');

function makeApp() {
  const app = express();
  app.get('/boom', () => {
    throw new Error('boom');
  });
  app.use(errorHandler);
  return app;
}

test('errorHandler returns 500 with message', async () => {
  const app = makeApp();
  const res = await request(app).get('/boom');
  expect(res.status).toBe(500);
  expect(res.body).toMatchObject({ error: 'Something went wrong' });
});


