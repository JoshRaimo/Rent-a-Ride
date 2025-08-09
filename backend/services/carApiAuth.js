const axios = require('axios');
const jwt = require('jsonwebtoken');

let cachedJwt = null;
let cachedExpiryEpoch = 0; // seconds since epoch

function isTokenValid() {
  if (!cachedJwt || !cachedExpiryEpoch) return false;
  const now = Math.floor(Date.now() / 1000);
  // Refresh 60 seconds before expiry
  return cachedExpiryEpoch - now > 60;
}

async function fetchNewJwt() {
  const apiToken = process.env.CAR_API_TOKEN || process.env.CAR_API_KEY; // support either name
  const apiSecret = process.env.CAR_API_SECRET;
  if (!apiToken || !apiSecret) {
    throw new Error('Missing CAR_API_TOKEN (or CAR_API_KEY) and/or CAR_API_SECRET in environment');
  }

  const response = await axios.post('https://carapi.app/api/auth/login', {
    api_token: apiToken,
    api_secret: apiSecret,
  });

  const token = response.data?.jwt || response.data?.token || response.data;
  if (!token || typeof token !== 'string') {
    throw new Error('Unexpected CarAPI auth response');
  }

  const decoded = jwt.decode(token);
  const exp = decoded?.exp;
  if (!exp) {
    // If no exp, default to 10 minutes from now
    cachedExpiryEpoch = Math.floor(Date.now() / 1000) + 600;
  } else {
    cachedExpiryEpoch = exp;
  }
  cachedJwt = token;
  return cachedJwt;
}

async function getCarApiJwt() {
  if (isTokenValid()) return cachedJwt;
  return fetchNewJwt();
}

async function getAuthHeader() {
  const token = await getCarApiJwt();
  return { Authorization: `Bearer ${token}` };
}

module.exports = { getCarApiJwt, getAuthHeader };


