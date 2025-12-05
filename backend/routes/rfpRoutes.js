const express = require('express');
const router = express.Router();
const rfpController = require('../controllers/rfpController');

router.post('/create-from-natural-language', rfpController.createRFPFromNaturalLanguage);
router.get('/', rfpController.getAllRFPs);
router.get('/:id', rfpController.getRFP);
router.post('/send', rfpController.sendRFPToVendors);

module.exports = router;

