import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseNaturalLanguage, createRFPFromNaturalLanguage } from '../api/api';
import './RFPCreate.css';

function RFPCreate() {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const exampleText = `I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty.`;

  const handleParse = async () => {
    if (!naturalLanguage.trim()) {
      setError('Please enter a description of what you want to procure');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await parseNaturalLanguage(naturalLanguage);
      if (response.data.success) {
        setParsedData(response.data.data);
        setSuccess('RFP parsed successfully! Review the structure below.');
      } else {
        setError(response.data.error || 'Failed to parse RFP');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to parse RFP');
      setParsedData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!parsedData) {
      setError('Please parse the RFP first');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await createRFPFromNaturalLanguage(naturalLanguage);
      if (response.data.success) {
        const rfpId = response.data.data.rfp.id;
        setSuccess('RFP created successfully!');
        // Small delay to ensure database commit completes
        setTimeout(() => {
          navigate(`/rfp/${rfpId}`, { replace: true });
        }, 300);
      } else {
        setError(response.data.error || 'Failed to create RFP');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create RFP');
    } finally {
      setCreating(false);
    }
  };

  const handleUseExample = () => {
    setNaturalLanguage(exampleText);
    setParsedData(null);
    setError(null);
  };

  return (
    <div className="rfp-create">
      <div className="card">
        <h2>Create RFP from Natural Language</h2>
        <p className="help-text">
          Describe what you want to procure in natural language. Our AI will extract
          the details and create a structured RFP.
        </p>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="input-group">
          <label htmlFor="naturalLanguage">
            Describe your procurement needs:
          </label>
          <textarea
            id="naturalLanguage"
            value={naturalLanguage}
            onChange={(e) => {
              setNaturalLanguage(e.target.value);
              setParsedData(null);
              setError(null);
            }}
            placeholder="Example: I need 20 laptops with 16GB RAM and 15 monitors. Budget is $50,000. Need delivery within 30 days..."
            rows={6}
            className="textarea-input"
          />
          <button
            type="button"
            onClick={handleUseExample}
            className="btn-link"
            style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}
          >
            Use example text
          </button>
        </div>

        <div className="button-group">
          <button
            onClick={handleParse}
            disabled={loading || !naturalLanguage.trim()}
            className="btn btn-primary"
          >
            {loading ? 'Parsing...' : 'Preview Parsed RFP'}
          </button>
        </div>

        {parsedData && (
          <div className="parsed-preview">
            <h3>Parsed RFP Structure</h3>
            <div className="preview-content">
              <div className="preview-section">
                <strong>Title:</strong> {parsedData.title || 'N/A'}
              </div>
              <div className="preview-section">
                <strong>Description:</strong> {parsedData.description || 'N/A'}
              </div>
              <div className="preview-section">
                <strong>Budget:</strong> {parsedData.budget ? `$${parseFloat(parsedData.budget).toLocaleString()}` : 'Not specified'}
              </div>
              <div className="preview-section">
                <strong>Delivery Date:</strong> {parsedData.delivery_date || 'Not specified'}
              </div>
              <div className="preview-section">
                <strong>Payment Terms:</strong> {parsedData.payment_terms || 'Not specified'}
              </div>
              <div className="preview-section">
                <strong>Warranty Period:</strong> {parsedData.warranty_period || 'Not specified'}
              </div>
              {parsedData.requirements && parsedData.requirements.length > 0 && (
                <div className="preview-section">
                  <strong>Requirements:</strong>
                  <ul>
                    {parsedData.requirements.map((req, idx) => (
                      <li key={idx}>
                        {req.item || req.name} 
                        {req.quantity && ` (Qty: ${req.quantity})`}
                        {req.specifications && ` - ${req.specifications}`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="button-group" style={{ marginTop: '1rem' }}>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="btn btn-success"
              >
                {creating ? 'Creating...' : 'Create RFP'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RFPCreate;

