const pool = require('../database/connection');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');
const { success, error: errorResponse } = require('../utils/responseHelper');

/**
 * Parse natural language to preview RFP structure (without saving)
 */
async function parseNaturalLanguage(req, res) {
  try {
    const { naturalLanguage } = req.body;

    if (!naturalLanguage) {
      return res.status(400).json(errorResponse('Natural language input is required'));
    }

    // Use AI to convert natural language to structured RFP
    const rfpData = await aiService.createRFPFromNaturalLanguage(naturalLanguage);

    // Calculate delivery_date from delivery_days if provided
    let delivery_date = rfpData.delivery_date;
    if (!delivery_date && rfpData.delivery_days) {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(rfpData.delivery_days));
      delivery_date = deliveryDate.toISOString().split('T')[0];
    }

    // Convert requirements format if needed
    const requirements = (rfpData.requirements || []).map(req => ({
      item: req.item || req.name || 'Item',
      quantity: req.quantity || null,
      specifications: req.specifications || req.spec || null
    }));

    return res.json(success({
      ...rfpData,
      delivery_date,
      requirements
    }));
  } catch (err) {
    console.error('Error parsing natural language:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to parse natural language', null, 500));
  }
}

/**
 * Create RFP from natural language
 */
async function createRFPFromNaturalLanguage(req, res) {
  try {
    const { naturalLanguage } = req.body;

    if (!naturalLanguage) {
      return res.status(400).json(errorResponse('Natural language input is required'));
    }

    // Use AI to convert natural language to structured RFP
    const rfpData = await aiService.createRFPFromNaturalLanguage(naturalLanguage);

    // Calculate delivery_date from delivery_days if provided
    let delivery_date = rfpData.delivery_date;
    if (!delivery_date && rfpData.delivery_days) {
      const deliveryDate = new Date();
      deliveryDate.setDate(deliveryDate.getDate() + parseInt(rfpData.delivery_days));
      delivery_date = deliveryDate.toISOString().split('T')[0];
    }

    // Convert requirements format if needed (name -> item)
    const requirements = (rfpData.requirements || []).map(req => ({
      item: req.item || req.name || 'Item',
      quantity: req.quantity || null,
      specifications: req.specifications || req.spec || null
    }));

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
        delivery_date,
        rfpData.payment_terms,
        rfpData.warranty_period,
        JSON.stringify(requirements),
      ]
    );

    return res.json(success({ rfp: result.rows[0] }, 'RFP created successfully'));
  } catch (err) {
    console.error('Error creating RFP:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to create RFP', null, 500));
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
    // Parse JSON fields for SQLite compatibility
    const rfps = result.rows.map(rfp => ({
      ...rfp,
      requirements: typeof rfp.requirements === 'string' 
        ? JSON.parse(rfp.requirements) 
        : rfp.requirements
    }));
    return res.json(success({ rfps }));
  } catch (err) {
    console.error('Error fetching RFPs:', err);
    return res.status(500).json(errorResponse('Failed to fetch RFPs', null, 500));
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
    // Parse JSON fields for SQLite compatibility
    rfp.requirements = typeof rfp.requirements === 'string' 
      ? JSON.parse(rfp.requirements) 
      : rfp.requirements;

    // Get proposals
    const proposalsResult = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE p.rfp_id = $1
       ORDER BY p.created_at DESC`,
      [id]
    );
    
    // Parse JSON fields for SQLite compatibility
    const proposals = proposalsResult.rows.map(p => ({
      ...p,
      line_items: typeof p.line_items === 'string' ? JSON.parse(p.line_items) : p.line_items,
      extracted_data: typeof p.extracted_data === 'string' ? JSON.parse(p.extracted_data) : p.extracted_data,
    }));

    // Get scores
    const scoresResult = await pool.query(
      `SELECT ps.*, p.vendor_id
       FROM proposal_scores ps
       JOIN proposals p ON ps.proposal_id = p.id
       WHERE p.rfp_id = $1`,
      [id]
    );

    return res.json(success({
      rfp,
      proposals,
      scores: scoresResult.rows,
    }));
  } catch (err) {
    console.error('Error fetching RFP:', err);
    return res.status(500).json(errorResponse('Failed to fetch RFP', null, 500));
  }
}

/**
 * Send RFP to selected vendors
 */
async function sendRFPToVendors(req, res) {
  try {
    const { rfpId, vendorIds } = req.body;

    if (!rfpId || !vendorIds || !Array.isArray(vendorIds)) {
      return res.status(400).json(errorResponse('RFP ID and vendor IDs are required'));
    }

    // Get RFP data
    const rfpResult = await pool.query('SELECT * FROM rfps WHERE id = $1', [rfpId]);
    if (rfpResult.rows.length === 0) {
      return res.status(404).json(errorResponse('RFP not found', null, 404));
    }

    const rfp = rfpResult.rows[0];
    // Parse JSON fields for SQLite compatibility
    rfp.requirements = typeof rfp.requirements === 'string' 
      ? JSON.parse(rfp.requirements) 
      : rfp.requirements;

    const results = [];

    for (const vendorId of vendorIds) {
      // Get vendor info
      const vendorResult = await pool.query('SELECT * FROM vendors WHERE id = $1', [vendorId]);
      if (vendorResult.rows.length === 0) continue;

      const vendor = vendorResult.rows[0];

      // Generate email content
      const emailSubject = `RFP: ${rfp.title}`;
      const emailBody = `
Dear ${vendor.name || 'Vendor'},

We are requesting a proposal for the following procurement:

${rfp.title}

Description:
${rfp.description}

Requirements:
${rfp.requirements?.map((req, idx) => 
  `${idx + 1}. ${req.item}${req.quantity ? ` (Quantity: ${req.quantity})` : ''}${req.specifications ? ` - ${req.specifications}` : ''}`
).join('\n') || 'See details in RFP'}

Budget: ${rfp.budget ? `$${rfp.budget.toLocaleString()}` : 'Not specified'}
Delivery Date Required: ${rfp.delivery_date || 'Not specified'}
Payment Terms: ${rfp.payment_terms || 'Not specified'}
Warranty Required: ${rfp.warranty_period || 'Not specified'}
Deadline for Response: ${rfp.deadline || 'Not specified'}

Please reply to this email with your proposal, including:
- Detailed pricing for all items
- Payment terms
- Delivery timeline
- Warranty information
- Any additional terms or conditions

Thank you for your interest.

Best regards,
Procurement Team
      `.trim();

      let emailResult = { subject: emailSubject, body: emailBody, messageId: null };
      let emailSent = false;

      // Try to send email, but don't fail if email is not configured
      try {
        emailResult = await emailService.sendRFPEmail(
          vendor.email,
          vendor.name,
          rfp
        );
        emailSent = true;
      } catch (emailError) {
        // Email not configured - continue without sending email
        console.warn(`Email not sent to ${vendor.email}: ${emailError.message}`);
        emailResult.messageId = `local-${Date.now()}-${vendorId}`;
      }

      // Record in database (even if email wasn't actually sent)
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
        emailSent,
        warning: emailSent ? null : 'Email configuration not set - RFP saved but email not sent. Configure SMTP settings in .env to enable email sending.',
      });
    }

    // Update RFP status
    await pool.query('UPDATE rfps SET status = $1 WHERE id = $2', ['sent', rfpId]);

    // Check if any emails were actually sent
    const allEmailsSent = results.every(r => r.emailSent);
    const someEmailsSent = results.some(r => r.emailSent);
    
    let message = 'RFP sent successfully';
    if (!allEmailsSent && someEmailsSent) {
      message = 'RFP sent to some vendors. Some emails failed - check configuration.';
    } else if (!allEmailsSent) {
      message = 'RFP saved successfully. Email sending is not configured - RFPs are recorded in the database. Configure SMTP settings to enable email sending.';
    }

    return res.json(success({ results }, message));
  } catch (err) {
    console.error('Error sending RFP:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to send RFP', null, 500));
  }
}

module.exports = {
  parseNaturalLanguage,
  createRFPFromNaturalLanguage,
  getAllRFPs,
  getRFP,
  sendRFPToVendors,
};

