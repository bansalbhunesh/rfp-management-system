import React, { useState } from 'react';
import { mockInboundEmail } from '../api/api';
import './MockDemo.css';

function MockDemo() {
  const [emailData, setEmailData] = useState({
    fromEmail: 'vendor@example.com',
    subject: 'Re: RFP: Office Equipment',
    body: `Thank you for the RFP. We are pleased to submit our proposal:

20 Laptops (16GB RAM) - $800 each = $16,000
15 Monitors (27-inch) - $300 each = $4,500

Total: $20,500

Payment Terms: Net 30
Warranty: 1 year
Delivery: Within 25 days

We look forward to working with you.`
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await mockInboundEmail(emailData);
      if (response.data.success) {
        setResult(response.data.data);
      } else {
        setError(response.data.error || 'Failed to process email');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mock-demo">
      <div className="card">
        <h2>Mock Inbound Email Demo</h2>
        <p className="help-text">
          Simulate receiving a vendor response email. This endpoint processes the email,
          parses it with AI, and saves it as a proposal. No IMAP configuration needed!
        </p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="fromEmail">From Email:</label>
            <input
              type="email"
              id="fromEmail"
              value={emailData.fromEmail}
              onChange={(e) => setEmailData({ ...emailData, fromEmail: e.target.value })}
              required
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="subject">Subject:</label>
            <input
              type="text"
              id="subject"
              value={emailData.subject}
              onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
              className="input-field"
            />
          </div>

          <div className="input-group">
            <label htmlFor="body">Email Body:</label>
            <textarea
              id="body"
              value={emailData.body}
              onChange={(e) => setEmailData({ ...emailData, body: e.target.value })}
              rows={10}
              required
              className="textarea-input"
            />
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Processing...' : 'Process Email'}
          </button>
        </form>

        {result && (
          <div className="result-preview">
            <h3>Processing Result</h3>
            {result.message && (
              <div className="alert alert-success">{result.message}</div>
            )}
            
            {result.parsed && (
              <div className="parsed-data">
                <h4>Parsed Data:</h4>
                <pre>{JSON.stringify(result.parsed, null, 2)}</pre>
              </div>
            )}

            {result.proposal && (
              <div className="proposal-data">
                <h4>Saved Proposal:</h4>
                <div className="proposal-info">
                  <p><strong>Vendor:</strong> {result.proposal.vendor_name || result.proposal.vendor_email}</p>
                  <p><strong>Total Price:</strong> ${result.proposal.total_price ? parseFloat(result.proposal.total_price).toLocaleString() : 'N/A'}</p>
                  <p><strong>Payment Terms:</strong> {result.proposal.payment_terms || 'N/A'}</p>
                  <p><strong>Warranty:</strong> {result.proposal.warranty_period || 'N/A'}</p>
                  <p><strong>Delivery Date:</strong> {result.proposal.delivery_date || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default MockDemo;

