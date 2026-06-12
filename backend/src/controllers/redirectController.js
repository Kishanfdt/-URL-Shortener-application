const Url = require('../models/Url');
const Analytics = require('../models/Analytics');
const { parseUserAgent } = require('../utils/userAgentParser');
const { resolveCountryByIp } = require('../utils/geoIpResolver');

/**
 * @desc    Redirect short URL to original destination & log visitor details
 * @route   GET /:shortCode
 * @access  Public
 */
const redirectUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    // Find original URL mapping
    const url = await Url.findOne({ shortCode });

    if (!url) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px 20px; background-color: #0b0e1a; color: #f8fafc; }
              .card { max-width: 500px; margin: 0 auto; background: #151829; padding: 40px; border-radius: 16px; border: 1px solid #222538; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
              h1 { color: #f84464; margin-top: 0; font-weight: 800; }
              p { font-size: 1.1em; line-height: 1.5; color: #94a3b8; }
              a { color: #f84464; text-decoration: none; font-weight: bold; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>404 Link Not Found</h1>
              <p>The shortened link you are trying to access does not exist or has been deleted.</p>
              <p><a href="/">Go to Home</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Check expiration
    if (url.expiresAt && new Date(url.expiresAt) <= new Date()) {
      return res.status(410).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Link Expired</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 50px 20px; background-color: #0b0e1a; color: #f8fafc; }
              .card { max-width: 500px; margin: 0 auto; background: #151829; padding: 40px; border-radius: 16px; border: 1px solid #222538; box-shadow: 0 8px 30px rgba(0,0,0,0.3); }
              h1 { color: #f84464; margin-top: 0; font-weight: 800; }
              p { font-size: 1.1em; line-height: 1.5; color: #94a3b8; }
              a { color: #f84464; text-decoration: none; font-weight: bold; }
              a:hover { text-decoration: underline; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>This link has expired</h1>
              <p>The shortened link you are trying to access has reached its expiration date and is no longer active.</p>
              <p><a href="/">Go to Home</a></p>
            </div>
          </body>
        </html>
      `);
    }

    // Capture visitor headers for analytics
    const userAgent = req.headers['user-agent'] || '';
    const { browser, os, device } = parseUserAgent(userAgent);
    const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    
    // Resolve multiple IPs if passed through proxies (take the first client IP)
    const clientIp = ipAddress.split(',')[0].trim();

    // Respond with redirection immediately (sub-100ms response)
    res.redirect(url.originalUrl);

    // Asynchronously log analytics & increment counter in background
    (async () => {
      try {
        // Increment global click counter
        await Url.updateOne({ _id: url._id }, { $inc: { clicks: 1 } });

        // Resolve visitor country from IP
        const country = await resolveCountryByIp(clientIp);

        // Insert click entry log with advanced analytics
        await Analytics.create({
          urlId: url._id,
          ip: clientIp,
          browser,
          os,
          device,
          country
        });
      } catch (err) {
        console.error('Background Analytics Log Error:', err.message);
      }
    })();

  } catch (error) {
    next(error);
  }
};

module.exports = { redirectUrl };
