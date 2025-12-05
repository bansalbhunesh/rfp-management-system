const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');

/**
 * Mock inbound email endpoint for local demos
 * Simulates receiving an email from a vendor without needing IMAP configuration
 */
router.post('/inbound-email', proposalController.mockInboundEmail);

module.exports = router;

