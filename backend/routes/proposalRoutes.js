const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

router.post('/process', proposalController.processVendorResponse);
router.get('/compare/:rfpId', proposalController.compareProposals);
router.post('/check-emails', proposalController.checkEmails);

module.exports = router;

