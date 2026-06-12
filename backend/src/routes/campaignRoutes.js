const express = require('express');
const {
  createCampaign,
  getCampaigns,
  getCampaign,
  deleteCampaign
} = require('../controllers/campaignController');

const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

// All campaign routes require authentication
router.use(protect);

router.route('/')
  .post(createCampaign)
  .get(getCampaigns);

router.route('/:id')
  .get(getCampaign)
  .delete(deleteCampaign);

module.exports = router;
