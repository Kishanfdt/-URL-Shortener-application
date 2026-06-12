const Campaign = require('../models/Campaign');
const Url = require('../models/Url');
const urlService = require('../services/urlService');
const aiService = require('../services/aiService');

/**
 * @desc    Create a new campaign
 * @route   POST /api/v1/campaigns
 * @access  Private
 */
const createCampaign = async (req, res, next) => {
  try {
    const { name, urls } = req.body;
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Campaign name is required' });
    }
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ success: false, message: 'Please provide at least one URL' });
    }

    const host = `${req.protocol}://${req.get('host')}`;
    const urlIds = [];

    // Create a new URL document for each provided URL
    for (const originalUrl of urls) {
      // Validate basic URL
      try {
        new URL(originalUrl);
      } catch (err) {
        continue; // Skip invalid URLs
      }
      
      const newUrl = await urlService.createUrl(originalUrl, req.user._id, host, undefined, undefined, true);
      urlIds.push(newUrl.id);
    }

    if (urlIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid URLs provided' });
    }

    const campaign = await Campaign.create({
      userId: req.user._id,
      name,
      urls: urlIds
    });

    res.status(201).json({
      success: true,
      campaign
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all campaigns for a user
 * @route   GET /api/v1/campaigns
 * @access  Private
 */
const getCampaigns = async (req, res, next) => {
  try {
    const campaigns = await Campaign.find({ userId: req.user._id })
      .populate('urls', 'originalUrl shortCode clicks createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: campaigns.length,
      campaigns
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get a single campaign and its analytics/insights
 * @route   GET /api/v1/campaigns/:id
 * @access  Private
 */
const getCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id })
      .populate('urls');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const host = `${req.protocol}://${req.get('host')}`;
    let totalClicks = 0;
    const urlStats = [];

    campaign.urls.forEach(url => {
      totalClicks += url.clicks;
      urlStats.push({
        id: url._id,
        originalUrl: url.originalUrl,
        shortUrl: `${host}/${url.shortCode}`,
        clicks: url.clicks,
        createdAt: url.createdAt
      });
    });

    // Generate AI Insights if there are clicks
    let aiInsights = campaign.aiInsights;
    if (totalClicks > 0) {
      aiInsights = await aiService.generateCampaignInsights(urlStats);
      // Update campaign in DB with latest insights
      campaign.aiInsights = aiInsights;
      await campaign.save();
    }

    res.status(200).json({
      success: true,
      campaign: {
        id: campaign._id,
        name: campaign.name,
        totalClicks,
        urls: urlStats,
        aiInsights,
        createdAt: campaign.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a campaign
 * @route   DELETE /api/v1/campaigns/:id
 * @access  Private
 */
const deleteCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findOne({ _id: req.params.id, userId: req.user._id });

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Delete all URLs associated with this campaign
    for (const urlId of campaign.urls) {
      try {
        await urlService.deleteUrl(urlId, req.user._id);
      } catch (err) {
        // Ignore errors for individual URLs if they don't exist
      }
    }

    await Campaign.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCampaign,
  getCampaigns,
  getCampaign,
  deleteCampaign
};
