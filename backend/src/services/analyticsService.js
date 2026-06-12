const mongoose = require('mongoose');
const Url = require('../models/Url');
const Analytics = require('../models/Analytics');

/**
 * Fetch aggregation summary and recent logs for a specific shortened URL
 * @param {string} urlId - The ID of the URL
 * @param {string} userId - The ID of the user requesting analytics (for ownership protection)
 * @param {number} limit - Number of recent clicks to return
 */
const getUrlAnalytics = async (urlId, userId, limit = 10) => {
  // 1. Fetch URL from database to verify existence and check ownership
  const url = await Url.findById(urlId);
  
  if (!url) {
    const error = new Error('URL not found');
    error.statusCode = 404;
    throw error;
  }

  // Verify ownership
  if (url.userId.toString() !== userId.toString()) {
    const error = new Error('Not authorized to access analytics for this URL');
    error.statusCode = 403;
    throw error;
  }

  // 2. Query recent click logs sorted by timestamp descending
  const recentVisits = await Analytics.find({ urlId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .select('-__v'); // Exclude mongoose revision field

  // 3. Extract the last visited timestamp
  const lastVisited = recentVisits.length > 0 ? recentVisits[0].timestamp : null;

  // 4. Aggregate daily clicks for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyTrend = await Analytics.aggregate([
    {
      $match: {
        urlId: new mongoose.Types.ObjectId(urlId),
        timestamp: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 5. Aggregate monthly clicks for the last 12 months
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const monthlyTrend = await Analytics.aggregate([
    {
      $match: {
        urlId: new mongoose.Types.ObjectId(urlId),
        timestamp: { $gte: twelveMonthsAgo }
      }
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m", date: "$timestamp" } },
        clicks: { $sum: 1 }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 6. Aggregate clicks by Browser
  const browserDistribution = await Analytics.aggregate([
    { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
    { $group: { _id: "$browser", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 7. Aggregate clicks by OS
  const osDistribution = await Analytics.aggregate([
    { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
    { $group: { _id: "$os", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 8. Aggregate clicks by Device Type
  const deviceDistribution = await Analytics.aggregate([
    { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
    { $group: { _id: "$device", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  // 9. Aggregate clicks by Country
  const countryDistribution = await Analytics.aggregate([
    { $match: { urlId: new mongoose.Types.ObjectId(urlId) } },
    { $group: { _id: "$country", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  return {
    urlId: url._id,
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    totalClicks: url.clicks,
    lastVisited,
    recentVisits,
    dailyTrend,
    monthlyTrend,
    browserDistribution,
    osDistribution,
    deviceDistribution,
    countryDistribution
  };
};

module.exports = {
  getUrlAnalytics
};
