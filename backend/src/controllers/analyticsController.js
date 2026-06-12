const analyticsService = require('../services/analyticsService');

/**
 * @desc    Get analytics for a specific shortened URL
 * @route   GET /api/v1/analytics/:urlId
 * @access  Private (Authenticated users only)
 */
const getAnalytics = async (req, res, next) => {
  try {
    const { urlId } = req.params;
    const userId = req.user._id;

    // Optional query parameter to adjust recent logs limit
    const limit = parseInt(req.query.limit, 10) || 10;

    const data = await analyticsService.getUrlAnalytics(urlId, userId, limit);

    res.status(200).json({
      success: true,
      analytics: data
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};
