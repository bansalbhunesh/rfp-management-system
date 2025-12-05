import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRFPFromNaturalLanguage } from '../api/api';
import './CreateRFP.css';

function CreateRFP() {
  const [naturalLanguage, setNaturalLanguage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdRFP, setCreatedRFP] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!naturalLanguage.trim()) {
      setError('Please enter a description of what you want to procure');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await createRFPFromNaturalLanguage(naturalLanguage);
      setCreatedRFP(response.data.rfp);
      setSuccess(true);
      setNaturalLanguage('');
      
      // Redirect to RFP detail after 2 seconds
      setTimeout(() => {
        navigate(`/rfp/${response.data.rfp.id}`);
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create RFP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-rfp">
      <div className="card">
        <h2>Create RFP from Natural Language</h2>
        <p className="help-text">
          Describe what you want to procure in natural language. Our AI will extract
          the details and create a structured RFP.
        </p>

        {error && <div className="error">{error}</div>}
        {success && (
          <div className="success">
            RFP created successfully! Redirecting to RFP details...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="naturalLanguage">
              Describe your procurement needs:
            </label>
            <textarea
              id="naturalLanguage"
              value={naturalLanguage}
              onChange={(e) => setNaturalLanguage(e.target.value)}
              placeholder="Example: I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
              disabled={loading}
              rows={8}
            />
          </div>

          <div className="button-group">
            <button
              type="submit"
              className="button"
              disabled={loading || !naturalLanguage.trim()}
            >
              {loading ? 'Creating RFP...' : 'Create RFP'}
            </button>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => navigate('/')}
            >
              Cancel
            </button>
          </div>
        </form>

        {createdRFP && (
          <div className="preview mt-2">
            <h3>Created RFP Preview:</h3>
            <pre>{JSON.stringify(createdRFP, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default CreateRFP;

