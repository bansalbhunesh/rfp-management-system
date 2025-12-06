const pool = require('../database/connection');
const aiService = require('../services/aiService');
const { success, error: errorResponse } = require('../utils/responseHelper');

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
      return res.status(400).json(errorResponse('Email body and sender email are required'));
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

    // Parse JSON fields for SQLite compatibility
    const proposal = proposalResult.rows[0];
    if (proposal) {
      proposal.line_items = typeof proposal.line_items === 'string' 
        ? JSON.parse(proposal.line_items) 
        : proposal.line_items;
      proposal.extracted_data = typeof proposal.extracted_data === 'string' 
        ? JSON.parse(proposal.extracted_data) 
        : proposal.extracted_data;
    }

    return res.json(success({ proposal }));
  } catch (err) {
    console.error('Error processing vendor response:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to process vendor response', null, 500));
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
      return res.status(404).json(errorResponse('RFP not found', null, 404));
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
      return res.status(400).json(errorResponse('No proposals found for this RFP'));
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

    // Parse JSON fields for proposals
    const parsedProposals = proposalsResult.rows.map(p => ({
      ...p,
      line_items: typeof p.line_items === 'string' ? JSON.parse(p.line_items) : p.line_items,
      extracted_data: typeof p.extracted_data === 'string' ? JSON.parse(p.extracted_data) : p.extracted_data,
    }));

    return res.json(success({
      comparison,
      proposals: parsedProposals,
    }));
  } catch (err) {
    console.error('Error comparing proposals:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to compare proposals', null, 500));
  }
}

/**
 * Manually trigger email check
 */
async function checkEmails(req, res) {
  try {
    const emailService = require('../services/emailService');
    const processedEmails = [];

    try {
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
          console.error('Error processing email:', error);
          processedEmails.push({ ...emailData, processed: false, error: error.message });
        }
      });

      const successCount = processedEmails.filter(e => e.processed).length;
      const totalCount = processedEmails.length;

      return res.json(success({
        processed: successCount,
        total: totalCount,
        emails: processedEmails,
        message: totalCount === 0 
          ? 'No new emails found in inbox'
          : `Processed ${successCount} of ${totalCount} email(s)`
      }));
    } catch (imapError) {
      // Handle IMAP-specific errors
      let errorMessage = 'Failed to check emails';
      
      if (imapError.message.includes('timeout') || imapError.message.includes('Timed out')) {
        errorMessage = 'IMAP connection timed out. Please check your IMAP settings in .env file. For Gmail, ensure you\'re using an App Password and that IMAP is enabled.';
      } else if (imapError.message.includes('authentication') || imapError.message.includes('EAUTH')) {
        errorMessage = 'IMAP authentication failed. Please check your IMAP_USER and IMAP_PASSWORD in .env file.';
      } else if (imapError.message.includes('ENOTFOUND') || imapError.message.includes('ECONNREFUSED')) {
        errorMessage = 'Cannot connect to IMAP server. Please check your IMAP_HOST and IMAP_PORT settings.';
      } else {
        errorMessage = imapError.message || 'Failed to check emails';
      }

      console.error('Error checking emails:', imapError);
      return res.status(500).json(errorResponse(errorMessage, null, 500));
    }
  } catch (err) {
    console.error('Error checking emails:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to check emails', null, 500));
  }
}

/**
 * Mock inbound email handler for local demos
 * Simulates receiving an email from a vendor
 */
async function mockInboundEmail(req, res) {
  try {
    const { fromEmail, subject, body, messageId } = req.body;

    if (!fromEmail || !body) {
      return res.status(400).json(errorResponse('fromEmail and body are required'));
    }

    // Try to find or create vendor
    let vendorResult = await pool.query('SELECT * FROM vendors WHERE email = $1', [fromEmail]);
    let vendor;

    if (vendorResult.rows.length === 0) {
      // Auto-create vendor if not found
      const createResult = await pool.query(
        `INSERT INTO vendors (name, email, contact_person)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [fromEmail.split('@')[0], fromEmail, null]
      );
      vendor = createResult.rows[0];
    } else {
      vendor = vendorResult.rows[0];
    }

    // Find most recent RFP for this vendor
    const rfpVendorResult = await pool.query(
      `SELECT rfp_id FROM rfp_vendors
       WHERE vendor_id = $1
       ORDER BY sent_at DESC
       LIMIT 1`,
      [vendor.id]
    );

    if (rfpVendorResult.rows.length === 0) {
      // Parse without saving if no RFP found
      const parsedData = await aiService.parseVendorResponse(body, subject || '');
      return res.json(success({
        parsed: parsedData,
        message: 'Email parsed successfully, but no RFP found for this vendor. Add vendor to an RFP first.',
        vendor: vendor
      }));
    }

    const rfpId = rfpVendorResult.rows[0].rfp_id;

    // Process the vendor response
    await processVendorResponseInternal({
      emailBody: body,
      emailSubject: subject || '',
      fromEmail,
      messageId: messageId || `mock-${Date.now()}`
    });

    // Get the saved proposal
    const proposalResult = await pool.query(
      `SELECT p.*, v.name as vendor_name, v.email as vendor_email
       FROM proposals p
       JOIN vendors v ON p.vendor_id = v.id
       WHERE p.rfp_id = $1 AND p.vendor_id = $2
       ORDER BY p.created_at DESC
       LIMIT 1`,
      [rfpId, vendor.id]
    );

    // Parse JSON fields for SQLite compatibility
    const proposal = proposalResult.rows[0];
    if (proposal) {
      proposal.line_items = typeof proposal.line_items === 'string' 
        ? JSON.parse(proposal.line_items) 
        : proposal.line_items;
      proposal.extracted_data = typeof proposal.extracted_data === 'string' 
        ? JSON.parse(proposal.extracted_data) 
        : proposal.extracted_data;
    }

    return res.json(success({
      proposal,
      message: 'Vendor response processed and saved successfully'
    }));
  } catch (err) {
    console.error('Error in mock inbound email:', err);
    return res.status(500).json(errorResponse(err.message || 'Failed to process mock email', null, 500));
  }
}

module.exports = {
  processVendorResponse,
  compareProposals,
  checkEmails,
  mockInboundEmail,
  processVendorResponseInternal, // Export for reuse
};

