const nodemailer = require('nodemailer');
const Imap = require('imap');
const { simpleParser } = require('mailparser');
require('dotenv').config();

// SMTP transporter for sending emails
let transporter = null;

function getTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error('Email configuration incomplete. Please set SMTP_HOST, SMTP_USER, and SMTP_PASSWORD in .env file');
  }
  
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
}

/**
 * Send RFP email to a vendor
 */
async function sendRFPEmail(vendorEmail, vendorName, rfpData) {
  const transporter = getTransporter();
  
  const emailSubject = `RFP: ${rfpData.title}`;
  
  const emailBody = `
Dear ${vendorName || 'Vendor'},

We are requesting a proposal for the following procurement:

${rfpData.title}

Description:
${rfpData.description}

Requirements:
${rfpData.requirements?.map((req, idx) => 
  `${idx + 1}. ${req.item}${req.quantity ? ` (Quantity: ${req.quantity})` : ''}${req.specifications ? ` - ${req.specifications}` : ''}`
).join('\n') || 'See details in RFP'}

Budget: ${rfpData.budget ? `$${rfpData.budget.toLocaleString()}` : 'Not specified'}
Delivery Date Required: ${rfpData.delivery_date || 'Not specified'}
Payment Terms: ${rfpData.payment_terms || 'Not specified'}
Warranty Required: ${rfpData.warranty_period || 'Not specified'}
Deadline for Response: ${rfpData.deadline || 'Not specified'}

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

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: vendorEmail,
      subject: emailSubject,
      text: emailBody,
      html: emailBody.replace(/\n/g, '<br>'),
    });

    return {
      success: true,
      messageId: info.messageId,
      subject: emailSubject,
      body: emailBody,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    if (error.code === 'EAUTH') {
      throw new Error('Email authentication failed. Please check your SMTP credentials in .env file.');
    }
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Check for new emails and parse vendor responses
 */
async function checkForNewEmails(callback) {
  if (!process.env.IMAP_HOST || !process.env.IMAP_USER || !process.env.IMAP_PASSWORD) {
    throw new Error('IMAP configuration incomplete. Please set IMAP_HOST, IMAP_USER, and IMAP_PASSWORD in .env file');
  }
  
  const imap = new Imap({
    user: process.env.IMAP_USER,
    password: process.env.IMAP_PASSWORD,
    host: process.env.IMAP_HOST,
    port: parseInt(process.env.IMAP_PORT || '993'),
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  });

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) {
          reject(err);
          return;
        }

        // Search for unread emails
        imap.search(['UNSEEN'], (err, results) => {
          if (err) {
            reject(err);
            return;
          }

          if (!results || results.length === 0) {
            imap.end();
            resolve([]);
            return;
          }

          const fetch = imap.fetch(results, { bodies: '', struct: true });
          const emails = [];

          fetch.on('message', (msg, seqno) => {
            let emailData = {
              messageId: null,
              subject: '',
              body: '',
              from: '',
              date: null,
            };

            msg.on('body', (stream, info) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  console.error('Error parsing email:', err);
                  return;
                }

                emailData.messageId = parsed.messageId;
                emailData.subject = parsed.subject || '';
                emailData.body = parsed.text || parsed.html || '';
                emailData.from = parsed.from?.text || '';
                emailData.date = parsed.date;

                if (callback) {
                  callback(emailData);
                }
                emails.push(emailData);
              });
            });

            msg.once('attributes', (attrs) => {
              const uid = attrs.uid;
              // Mark as read
              imap.addFlags(uid, '\\Seen', () => {});
            });
          });

          fetch.once('error', (err) => {
            reject(err);
          });

          fetch.once('end', () => {
            imap.end();
            resolve(emails);
          });
        });
      });
    });

    imap.once('error', (err) => {
      reject(err);
    });

    imap.connect();
  });
}

module.exports = {
  sendRFPEmail,
  checkForNewEmails,
};

