const mongoose = require('mongoose');

const UrlSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  originalUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true
  },
  shortCode: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: false
  },
  aiMetadata: {
    title: { type: String, default: '' },
    summary: { type: String, default: '' },
    keyPoints: [{ type: String }],
    headline: { type: String, default: '' },
    socialCaption: { type: String, default: '' },
    linkedinPost: { type: String, default: '' },
    twitterPost: { type: String, default: '' }
  },
  safetyInfo: {
    riskScore: { type: Number, default: 0 },
    status: { type: String, default: 'safe' },
    warning: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Url', UrlSchema);
