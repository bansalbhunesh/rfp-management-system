const pool = require('../database/connection');
const aiService = require('../services/aiService');

/**
 * Internal function to process vendor response (extracted for reuse)
 */
async function processVendorResponseInternal({ emailBody, emailSubject, fromEmail, messageId }) {
  // Find vendor by email
  const vendorResult = await pool.query('SELECT * FROM vendors WHERE email = $1', [fromEmail]);
  if (vendorResult.rows.length === 0) {
    throw new Error('Vendor not found. Please add vendor first.');
  }

  const vendor = vendorResult.rows[0];

  // Try to find associated RFP (check recent RFP-vendor relationships)
  const rfpVendorResult = await pool.query(
    `SELECT rfp_id FROM rfp_vendors
     WHERE vendor_id = $1
     ORDER BY sent_at DESC
     LIMIT 1`,
    [vendor.id]
  );

  if (rfpVendorResult.rows.length === 0) {
    throw new Error('No RFP found for this vendor');
  }

  const rfpId = rfpVendorResult.rows[0].rfp_id;

  // Use AI to parse the response
  const parsedData = await aiService.parseVendorResponse(emailBody, emailSubject);

  // Save proposal
  await pool.query(
    `INSERT INTO proposals (
      rfp_id, vendor_id, email_message_id, email_subject, email_body,
      total_price, line_items, payment_terms, warranty_period, delivery_date,
      additional_notes, extracted_data
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    ON CONFLICT (rfp_id, vendor_id) DO UPDATE
    SET email_message_id = $3, email_subject = $4, email_body = $5,
        total_price = $6, line_items = $7, payment_terms = $8,
        warranty_period = $9, delivery_date = $10, additional_notes = $11,
        extracted_data = $12, updated_at = NOW()`,
    [
      rfpId,
      vendor.id,
      messageId || null,
      emailSubject || '',
      emailBody,
      parsedData.total_price,
      JSON.stringify(parsedData.line_items || []),
      parsedData.payment_terms,
      parsedData.warranty_period,
      parsedData.delivery_date,
      parsedData.additional_notes,
      JSON.stringify(parsedData.extracted_data || parsedData),
    ]
  );
}

/**
 * Process incoming vendor response email
 */
async function processVendorResponse(req, res) {
  try {
    const { emailBody, emailSubject, fromEmail, messageId } = req.body;

    if (!emailBody || !fromEmail) {
      return res.status(400).json({ error: 'Email body and sender email are required' });
    }

    const result = await pool.query(
      `SELECT * FROM proposals
       WHERE rfp_id IN (
         SELECT rfp_id FROM rfp_vendors
         WHERE vendor_id = (SELECT id FROM vendors WHERE email = $1)
       )
       ORDER BY created_at DESC
       LIMIT 1`,
      [fromEmail]
    );

    await processVendorResponseInternal({ emailBody, emailSubject, fromEmail, messageId });

    const proposalResult = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE v.email = $1
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [fromEmail]
    );

    res.json({ proposal: proposalResult.rows[0] });
  } catch (error) {
    console.error('Error processing vendor response:', error);
    res.status(500).json({ error: error.message || 'Failed to process vendor response' });
  }
}

/**
 * Compare proposals for an RFP
 */
async function compareProposals(req, res) {
  try {
    const { rfpId } = req.params;

    // Get RFP
    const rfpResult = await pool.query('SELECT * FROM rfps WHERE id = $1', [rfpId]);
    if (rfpResult.rows.length === 0) {
      return res.status(404).json({ error: 'RFP not found' });
    }

    const rfp = rfpResult.rows[0];

    // Get all proposals
    const proposalsResult = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE p.rfp_id = $1`,
      [rfpId]
    );

    if (proposalsResult.rows.length === 0) {
      return res.status(400).json({ error: 'No proposals found for this RFP' });
    }

    // Prepare data for AI comparison
    const proposals = proposalsResult.rows.map(p => ({
      id: p.id,
      vendor_id: p.vendor_id,
      vendor_name: p.vendor_name,
      total_price: p.total_price,
      line_items: typeof p.line_items === 'string' ? JSON.parse(p.line_items) : p.line_items,
      payment_terms: p.payment_terms,
      warranty_period: p.warranty_period,
      delivery_date: p.delivery_date,
      additional_notes: p.additional_notes,
    }));

    // Use AI to compare
    const comparison = await aiService.compareProposals(proposals, rfp);

    // Save scores to database
    for (const proposal of proposals) {
      const scoreData = comparison.proposals?.find(p => p.id === proposal.id) || {};
      
      await pool.query(
        `INSERT INTO proposal_scores (
          proposal_id, overall_score, price_score, terms_score,
          completeness_score, recommendation_reason, ai_analysis
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (proposal_id) DO UPDATE
        SET overall_score = $2, price_score = $3, terms_score = $4,
            completeness_score = $5, recommendation_reason = $6, ai_analysis = $7`,
        [
          proposal.id,
          scoreData.overall_score || null,
          scoreData.price_score || null,
          scoreData.terms_score || null,
          scoreData.completeness_score || null,
          scoreData.recommendation_reason || null,
          JSON.stringify(comparison),
        ]
      );
    }

    res.json({
      comparison,
      proposals: proposalsResult.rows,
    });
  } catch (error) {
    console.error('Error comparing proposals:', error);
    res.status(500).json({ error: error.message || 'Failed to compare proposals' });
  }
}

/**
 * Manually trigger email check
 */
async function checkEmails(req, res) {
  try {
    const emailService = require('../services/emailService');
    const processedEmails = [];

    await emailService.checkForNewEmails(async (emailData) => {
      // Try to process this email as a vendor response
      try {
        // Extract email from "Name <email@example.com>" format
        const emailMatch = emailData.from.match(/<(.+)>/);
        const fromEmail = emailMatch ? emailMatch[1] : emailData.from;

        // Process the vendor response directly
        await processVendorResponseInternal({
          emailBody: emailData.body,
          emailSubject: emailData.subject,
          fromEmail: fromEmail,
          messageId: emailData.messageId,
        });

        processedEmails.push({ ...emailData, processed: true });
      } catch (error) {
        processedEmails.push({ ...emailData, processed: false, error: error.message });
      }
    });

    res.json({ processed: processedEmails.length, emails: processedEmails });
  } catch (error) {
    console.error('Error checking emails:', error);
    res.status(500).json({ error: error.message || 'Failed to check emails' });
  }
}

module.exports = {
  processVendorResponse,
  compareProposals,
  checkEmails,
};

