const axios = require('axios');

/**
 * Resolves country name from IP address using a free JSON IP API.
 * @param {string} ip - Visitor IP address
 * @returns {Promise<string>} Country name or 'Localhost' / 'Unknown'
 */
const resolveCountryByIp = async (ip) => {
  if (!ip) return 'Unknown';

  const cleanIp = ip.trim();

  // Check for local loopbacks / local subnet addresses
  if (
    cleanIp === '127.0.0.1' ||
    cleanIp === '::1' ||
    cleanIp.startsWith('192.168.') ||
    cleanIp.startsWith('10.') ||
    cleanIp.startsWith('127.') ||
    cleanIp.startsWith('::ffff:127.')
  ) {
    return 'Localhost';
  }

  try {
    // Call ip-api.com with a 2-second timeout to prevent blocking redirections
    const response = await axios.get(`http://ip-api.com/json/${cleanIp}`, {
      timeout: 2000
    });

    if (response.data && response.data.status === 'success' && response.data.country) {
      return response.data.country;
    }
  } catch (error) {
    console.error(`Geo IP Lookup failed for IP ${cleanIp}:`, error.message);
  }

  return 'Unknown';
};

module.exports = { resolveCountryByIp };
