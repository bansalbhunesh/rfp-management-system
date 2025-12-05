const pool = require('../database/connection');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

/**
 * Create RFP from natural language
 */
async function createRFPFromNaturalLanguage(req, res) {
  try {
    const { naturalLanguage } = req.body;

    if (!naturalLanguage) {
      return res.status(400).json({ error: 'Natural language input is required' });
    }

    // Use AI to convert natural language to structured RFP
    const rfpData = await aiService.createRFPFromNaturalLanguage(naturalLanguage);

    // Save to database
    const result = await pool.query(
      `INSERT INTO rfps (title, description, budget, deadline, delivery_date, payment_terms, warranty_period, requirements)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        rfpData.title,
        rfpData.description,
        rfpData.budget,
        rfpData.deadline,
        rfpData.delivery_date,
        rfpData.payment_terms,
        rfpData.warranty_period,
        JSON.stringify(rfpData.requirements || []),
      ]
    );

    res.json({ rfp: result.rows[0] });
  } catch (error) {
    console.error('Error creating RFP:', error);
    res.status(500).json({ error: error.message || 'Failed to create RFP' });
  }
}

/**
 * Get all RFPs
 */
async function getAllRFPs(req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM rfps ORDER BY created_at DESC'
    );
    res.json({ rfps: result.rows });
  } catch (error) {
    console.error('Error fetching RFPs:', error);
    res.status(500).json({ error: 'Failed to fetch RFPs' });
  }
}

/**
 * Get single RFP with proposals
 */
async function getRFP(req, res) {
  try {
    const { id } = req.params;

    // Get RFP
    const rfpResult = await pool.query('SELECT * FROM rfps WHERE id = $1', [id]);
    if (rfpResult.rows.length === 0) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const rfp = rfpResult.rows[0];

    // Get proposals
    const proposalsResult = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE p.rfp_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );

    // Get scores
    const scoresResult = await pool.query(
      `SELECT ps.*, p.vendor_id
       FROM proposal_scores ps
       JOIN proposals p ON ps.proposal_id = p.id
       WHERE p.rfp_id = $1`,
      [id]
    );

    res.json({
      rfp,
      proposals: proposalsResult.rows,
      scores: scoresResult.rows,
    });
  } catch (error) {
    console.error('Error fetching RFP:', error);
    res.status(500).json({ error: 'Failed to fetch RFP' });
  }
}

/**
 * Send RFP to selected vendors
 */
async function sendRFPToVendors(req, res) {
  try {
    const { rfpId, vendorIds } = req.body;

    if (!rfpId || !vendorIds || !Array.isArray(vendorIds)) {
      return res.status(400).json({ error: 'RFP ID and vendor IDs are required' });
    }

    // Get RFP data
    const rfpResult = await pool.query('SELECT * FROM rfps WHERE id = $1', [rfpId]);
    if (rfpResult.rows.length === 0) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const rfp = rfpResult.rows[0];
    rfp.requirements = typeof rfp.requirements === 'string' 
      ? JSON.parse(rfp.requirements) 
      : rfp.requirements;

    const results = [];

    for (const vendorId of vendorIds) {
      // Get vendor info
      const vendorResult = await pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
      if (vendorResult.rows.length === 0) continue;

      const vendor = vendorResult.rows[0];

      // Send email
      const emailResult = await emailService.sendRFPEmail(
        vendor.email,
        vendor.name,
        rfp
      );

      // Record in database
      await pool.query(
        `INSERT INTO rfp_vendors (rfp_id, vendor_id, sent_at, email_subject, email_body)
         VALUES ($1, $2, NOW(), $3, $4)
         ON CONFLICT (rfp_id, vendor_id) DO UPDATE
         SET sent_at = NOW(), email_subject = $3, email_body = $4`,
        [rfpId, vendorId, emailResult.subject, emailResult.body]
      );

      results.push({
        vendorId,
        vendorName: vendor.name,
        success: true,
        messageId: emailResult.messageId,
      });
    }

    // Update RFP status
    await pool.query('UPDATE rfps SET status = $1 WHERE id = $2', ['sent', rfpId]);

    res.json({ results });
  } catch (error) {
    console.error('Error sending RFP:', error);
    res.status(500).json({ error: error.message || 'Failed to send RFP' });
  }
}

module.exports = {
  createRFPFromNaturalLanguage,
  getAllRFPs,
  getRFP,
  sendRFPToVendors,
};

