import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRFP, getAllVendors, sendRFPToVendors, compareProposals, checkEmails } from '../api/api';
import { showSuccess, showError, showInfo } from '../utils/toast';
import './RFPDetail.css';

function RFPDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rfp, setRFP] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [scores, setScores] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedVendors, setSelectedVendors] = useState([]);
  const [showSendForm, setShowSendForm] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparison, setComparison] = useState(null);

  useEffect(() => {
    loadRFP();
    loadAllVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadRFP = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getRFP(id);
      
      // Handle both response formats
      let data;
      if (response.data.success) {
        data = response.data.data;
      } else if (response.data.error) {
        // Error response
        throw new Error(response.data.error);
      } else {
        // Legacy format
        data = response.data;
      }
      
      if (!data || !data.rfp) {
        throw new Error('RFP not found');
      }
      
      setRFP(data.rfp);
      setProposals(data.proposals || []);
      setScores(data.scores || []);
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to load RFP';
      setError(errorMsg);
      showError(errorMsg);
      console.error('Error loading RFP:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAllVendors = async () => {
    try {
      const response = await getAllVendors();
      // Handle new API response format { success, data } or old format
      const data = response.data.success ? response.data.data : response.data;
      setAllVendors(data.vendors || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
      setAllVendors([]);
    }
  };

  const handleSendRFP = async () => {
    if (selectedVendors.length === 0) {
      const errorMsg = 'Please select at least one vendor';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      const response = await sendRFPToVendors(id, selectedVendors);
      const data = response.data.success ? response.data.data : response.data;
      
      // Check if any emails had warnings
      const hasWarnings = data.results?.some(r => r.warning);
      
      if (hasWarnings) {
        const warningMsg = data.results.find(r => r.warning)?.warning;
        showError(warningMsg || 'RFP recorded but emails not sent. Configure email settings to send emails.');
        setError(warningMsg || 'Email configuration incomplete');
      } else {
        // Use the message from backend, or create a detailed one
        const backendMessage = response.data.message || 'RFP sent successfully';
        const sentCount = data.results?.filter(r => r.success && r.emailSent).length || 0;
        const totalCount = data.results?.length || selectedVendors.length;
        const vendorNames = data.results?.map(r => r.vendorName).filter(Boolean).join(', ') || 'vendors';
        
        let message = backendMessage;
        if (sentCount === totalCount && totalCount > 0) {
          message = `✅ ${backendMessage} - Sent to: ${vendorNames}`;
        }
        
        showSuccess(message);
        setSuccess(message);
      }
      
      setShowSendForm(false);
      setSelectedVendors([]);
      loadRFP();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to send RFP';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const handleCompare = async () => {
    if (proposals.length < 2) {
      const errorMsg = 'Need at least 2 proposals to compare';
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    setComparing(true);
    setError(null);

    try {
      const response = await compareProposals(id);
      const data = response.data.success ? response.data.data : response.data;
      setComparison(data.comparison);
      setScores(data.scores || []);
      showSuccess('Proposals compared successfully');
      loadRFP();
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to compare proposals';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setComparing(false);
    }
  };

  const handleCheckEmails = async () => {
    setError(null);
    setSuccess(null);

    try {
      const response = await checkEmails();
      const data = response.data.success ? response.data.data : response.data;
      if (data.processed > 0) {
        showSuccess(`Processed ${data.processed} email(s)`);
        loadRFP();
      } else {
        showInfo('No new emails found');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Failed to check emails';
      setError(errorMsg);
      showError(errorMsg);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getScoreForProposal = (proposalId) => {
    return scores.find(s => s.proposal_id === proposalId);
  };

  if (loading) {
    return <div className="loading">Loading RFP...</div>;
  }

  if (!rfp && !loading) {
    return (
      <div className="card">
        <div className="error" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>RFP Not Found</h2>
          <p>The RFP you're looking for doesn't exist or may have been deleted.</p>
          <button className="button" onClick={() => navigate('/')} style={{ marginTop: '1rem' }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const requirements = typeof rfp.requirements === 'string' 
    ? JSON.parse(rfp.requirements) 
    : rfp.requirements || [];

  return (
    <div className="rfp-detail">
      <div className="card">
        <div className="flex-between">
          <h2>{rfp.title}</h2>
          <button className="button button-secondary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="rfp-info mt-2">
          <div className="info-row">
            <strong>Description:</strong>
            <p>{rfp.description}</p>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <strong>Budget:</strong> {formatCurrency(rfp.budget)}
            </div>
            <div className="info-item">
              <strong>Deadline:</strong> {formatDate(rfp.deadline)}
            </div>
            <div className="info-item">
              <strong>Delivery Date:</strong> {formatDate(rfp.delivery_date)}
            </div>
            <div className="info-item">
              <strong>Payment Terms:</strong> {rfp.payment_terms || 'N/A'}
            </div>
            <div className="info-item">
              <strong>Warranty Period:</strong> {rfp.warranty_period || 'N/A'}
            </div>
            <div className="info-item">
              <strong>Status:</strong> <span className={`badge badge-${rfp.status}`}>{rfp.status}</span>
            </div>
          </div>

          {requirements.length > 0 && (
            <div className="requirements mt-2">
              <strong>Requirements:</strong>
              <ul>
                {requirements.map((req, idx) => (
                  <li key={idx}>
                    {req.item}
                    {req.quantity && ` (Quantity: ${req.quantity})`}
                    {req.specifications && ` - ${req.specifications}`}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="actions mt-2">
          <div className="button-group">
            <button
              className="button"
              onClick={() => setShowSendForm(!showSendForm)}
            >
              {showSendForm ? 'Cancel' : 'Send RFP to Vendors'}
            </button>
            <button
              className="button button-secondary"
              onClick={handleCheckEmails}
            >
              Check for New Responses
            </button>
            {proposals.length >= 2 && (
              <button
                className="button button-success"
                onClick={handleCompare}
                disabled={comparing}
              >
                {comparing ? 'Comparing...' : 'Compare Proposals'}
              </button>
            )}
          </div>
        </div>

        {showSendForm && (
          <div className="send-form mt-2">
            <h3>Select Vendors to Send RFP</h3>
            {allVendors.length === 0 ? (
              <p>No vendors available. Please add vendors first.</p>
            ) : (
              <>
                <div className="vendor-checkboxes">
                  {allVendors.map((vendor) => (
                    <label key={vendor.id} className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedVendors.includes(vendor.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedVendors([...selectedVendors, vendor.id]);
                          } else {
                            setSelectedVendors(selectedVendors.filter(id => id !== vendor.id));
                          }
                        }}
                      />
                      {vendor.name} ({vendor.email})
                    </label>
                  ))}
                </div>
                <button className="button mt-2" onClick={handleSendRFP}>
                  Send RFP
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {comparison && (
        <div className="card mt-2">
          <h2>AI Comparison Results</h2>
          <div className="comparison-summary">
            <p><strong>Summary:</strong> {comparison.summary}</p>
            {comparison.best_proposal_id && (
              <p className="mt-1">
                <strong>Recommended Vendor:</strong> {
                  proposals.find(p => p.id === comparison.best_proposal_id)?.vendor_name || 
                  `Proposal #${comparison.best_proposal_id}`
                }
              </p>
            )}
            {comparison.key_differences && comparison.key_differences.length > 0 && (
              <div className="mt-1">
                <strong>Key Differences:</strong>
                <ul style={{ marginTop: '0.5rem', marginLeft: '1.5rem' }}>
                  {comparison.key_differences.map((diff, idx) => (
                    <li key={idx}>{diff}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="card mt-2">
        <h2>Proposals ({proposals.length})</h2>

        {proposals.length === 0 ? (
          <div style={{ padding: '1rem', backgroundColor: '#f8f9fa', borderRadius: '4px', border: '1px solid #dee2e6' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>📬 No proposals received yet</p>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
              {rfp.status === 'sent' 
                ? 'Vendors have been notified. They can reply to the RFP email, or you can use the /demo page to simulate a vendor response for testing.'
                : 'Send the RFP to vendors first. Once sent, vendors can reply via email, or you can use the /demo page to test vendor responses.'}
            </p>
          </div>
        ) : (
          <div className="proposals-list">
            {proposals.map((proposal) => {
              const score = getScoreForProposal(proposal.id);
              const lineItems = typeof proposal.line_items === 'string'
                ? JSON.parse(proposal.line_items)
                : proposal.line_items || [];

              return (
                <div key={proposal.id} className="proposal-card">
                  <div className="proposal-header">
                    <h3>{proposal.vendor_name}</h3>
                    {score && (
                      <div className="scores">
                        <span className="score-badge">
                          Overall: {score.overall_score?.toFixed(1)}/100
                        </span>
                        <span className="score-badge">
                          Price: {score.price_score?.toFixed(1)}/100
                        </span>
                        <span className="score-badge">
                          Terms: {score.terms_score?.toFixed(1)}/100
                        </span>
                        <span className="score-badge">
                          Completeness: {score.completeness_score?.toFixed(1)}/100
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="proposal-details">
                    <div className="detail-item">
                      <strong>Total Price:</strong> {formatCurrency(proposal.total_price)}
                    </div>
                    <div className="detail-item">
                      <strong>Payment Terms:</strong> {proposal.payment_terms || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Warranty:</strong> {proposal.warranty_period || 'N/A'}
                    </div>
                    <div className="detail-item">
                      <strong>Delivery Date:</strong> {formatDate(proposal.delivery_date)}
                    </div>
                  </div>

                  {lineItems.length > 0 && (
                    <div className="line-items mt-1">
                      <strong>Line Items:</strong>
                      <table className="table mt-1">
                        <thead>
                          <tr>
                            <th>Item</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {lineItems.map((item, idx) => (
                            <tr key={idx}>
                              <td>{item.item}</td>
                              <td>{item.quantity || 'N/A'}</td>
                              <td>{formatCurrency(item.unit_price)}</td>
                              <td>{formatCurrency(item.total_price)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {proposal.additional_notes && (
                    <div className="notes mt-1">
                      <strong>Additional Notes:</strong>
                      <p>{proposal.additional_notes}</p>
                    </div>
                  )}

                  {score?.recommendation_reason && (
                    <div className="recommendation mt-1">
                      <strong>AI Analysis:</strong>
                      <p>{score.recommendation_reason}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default RFPDetail;

