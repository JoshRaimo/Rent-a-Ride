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
  // In test environment, allow injecting a fake token to avoid network and brittle mocks
  if (process.env.NODE_ENV === 'test' && process.env.TEST_CARAPI_JWT) {
    cachedJwt = process.env.TEST_CARAPI_JWT;
    cachedExpiryEpoch = Math.floor(Date.now() / 1000) + 300;
    return cachedJwt;
  }

  const apiToken = process.env.CAR_API_TOKEN || process.env.CAR_API_KEY; // support either name
  const apiSecret = process.env.CAR_API_SECRET;

  // If only a key is provided and no secret, assume it's a long-lived API key usable as Bearer directly
  if (apiToken && !apiSecret) {
    cachedJwt = apiToken;
    // Set far-future expiry (e.g., 30 days) so we don't refresh unnecessarily
    cachedExpiryEpoch = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60;
    return cachedJwt;
  }

  if (!apiToken || !apiSecret) {
    throw new Error('Missing CarAPI credentials. Provide CAR_API_TOKEN and CAR_API_SECRET, or a long-lived CAR_API_KEY.');
  }

  const response = await axios.post('https://carapi.app/api/auth/login', {
    api_token: apiToken,
    api_secret: apiSecret,
  });

  const data = response && response.data ? response.data : response;
  const token = data?.jwt || data?.token || data;
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


