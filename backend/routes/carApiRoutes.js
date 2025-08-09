const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getAuthHeader } = require('../services/carApiAuth');

// Inject server-side CarAPI authorization
const withCarApiAuth = async (config = {}) => {
    const headers = await getAuthHeader();
    return { ...config, headers: { ...(config.headers || {}), ...headers } };
};

// Normalize API payloads that might vary between versions
function normalizeList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

async function fetchAllPages(url, baseParams) {
  const aggregated = [];
  let page = Number(baseParams?.page) || 1;
  const limit = Number(baseParams?.limit) || 100;
  while (true) {
    let res;
    try {
      res = await axios.get(url, await withCarApiAuth({ params: { ...baseParams, page, limit } }));
    } catch (err) {
      const status = err?.response?.status;
      const msg = String(err?.response?.data?.message || '');
      // Stop paging when CarAPI signals page out of bounds
      if (status === 404 && /out of bounds|only `\d+` page\(s\) exist/i.test(msg)) break;
      throw err;
    }

    const payload = res?.data;
    const list = normalizeList(payload);
    aggregated.push(...list);

    // Try to detect total pages from metadata
    const meta = payload?.meta || payload?.pagination || {};
    const totalPages = meta.total_pages || meta.totalPages;
    const currentPage = meta.page || meta.current_page || meta.pageNumber || page;
    if (totalPages && currentPage >= totalPages) break;

    // Fallback: stop when the returned list is smaller than the limit
    if (!totalPages && list.length < limit) break;
    page += 1;
  }
  return aggregated;
}

/**
 * Route to fetch car makes
 * Optional query parameters: page, limit
 */
router.get('/makes', async (req, res) => {
    try {
        const { page, limit, all } = req.query;
        let list;
        if (all === 'true' || (!page && !limit)) {
          list = await fetchAllPages('https://carapi.app/api/makes/v2', { page: 1, limit: 100 });
        } else {
          const response = await axios.get('https://carapi.app/api/makes/v2', await withCarApiAuth({ params: { page, limit } }));
          list = normalizeList(response?.data);
        }

        const normalized = list.map((m) => ({ name: m?.name ?? m?.make ?? m?.label ?? String(m) }));
        res.status(200).json({ data: normalized });
    } catch (error) {
        console.error('Error fetching car makes:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car makes',
            details: error.response?.data || error.message,
        });
    }
});

/**
 * Route to fetch car models for a specific make
 * Query Parameter: make (required)
 */
router.get('/models', async (req, res) => {
    const { make } = req.query;
    if (!make) {
        return res.status(400).json({ error: 'Make query parameter is required.' });
    }

    try {
        const { page, limit, all } = req.query;
        let list;
        if (all === 'true' || (!page && !limit)) {
          list = await fetchAllPages('https://carapi.app/api/models/v2', { make, page: 1, limit: 100 });
        } else {
          const response = await axios.get('https://carapi.app/api/models/v2', await withCarApiAuth({ params: { make, page, limit } }));
          list = normalizeList(response?.data);
        }
        const normalized = list.map((m) => ({ name: m?.name ?? m?.model ?? m?.label ?? String(m) }));
        res.status(200).json({ data: normalized });
    } catch (error) {
        console.error('Error fetching car models:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car models',
            details: error.response?.data || error.message,
        });
    }
});

/**
 * Route to fetch car years for a specific make and model
 * Query Parameters: make (required), model (required)
 */
router.get('/years', async (req, res) => {
    const { make, model } = req.query;

    // Ensure both make and model are provided
    if (!make || !model) {
        return res.status(400).json({ error: 'Both make and model query parameters are required.' });
    }

    try {
        const response = await axios.get('https://carapi.app/api/years/v2', await withCarApiAuth({ params: { make, model } }));

        const payload = response?.data;
        const list = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : Array.isArray(payload?.results)
              ? payload.results
              : Array.isArray(payload?.items)
                ? payload.items
                : [];
        // Ensure array of numbers / strings
        const normalized = list.map((y) => (typeof y === 'object' ? (y?.year ?? y?.name ?? y?.label) : y));
        res.status(200).json(normalized);
    } catch (error) {
        console.error('Error fetching car years:', {
            message: error.message,
            data: error.response?.data,
            headers: error.response?.headers,
        });
        res.status(500).json({
            error: 'Failed to fetch car years',
            details: error.response?.data || error.message,
        });
    }
});

module.exports = router;