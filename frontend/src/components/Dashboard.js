import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllRFPs } from '../api/api';
import './Dashboard.css';

function Dashboard() {
  const [rfps, setRfps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadRFPs();
  }, []);

  const loadRFPs = async () => {
    try {
      setLoading(true);
      const response = await getAllRFPs();
      setRfps(response.data.rfps);
      setError(null);
    } catch (err) {
      setError('Failed to load RFPs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: 'badge-draft',
      sent: 'badge-sent',
      closed: 'badge-closed',
    };
    return badges[status] || 'badge-draft';
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

  if (loading) {
    return <div className="loading">Loading RFPs...</div>;
  }

  return (
    <div className="dashboard">
      <div className="card">
        <div className="flex-between">
          <h2>RFPs</h2>
          <button className="button" onClick={() => navigate('/create-rfp')}>
            Create New RFP
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {rfps.length === 0 ? (
          <p>No RFPs yet. Create your first RFP to get started.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Budget</th>
                <th>Deadline</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rfps.map((rfp) => (
                <tr key={rfp.id}>
                  <td>
                    <strong>{rfp.title}</strong>
                  </td>
                  <td>{formatCurrency(rfp.budget)}</td>
                  <td>{formatDate(rfp.deadline)}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(rfp.status)}`}>
                      {rfp.status}
                    </span>
                  </td>
                  <td>{formatDate(rfp.created_at)}</td>
                  <td>
                    <button
                      className="button button-secondary"
                      onClick={() => navigate(`/rfp/${rfp.id}`)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Dashboard;

