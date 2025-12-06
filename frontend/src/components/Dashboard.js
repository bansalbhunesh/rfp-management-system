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
      // Handle new API response format { success, data } or old format
      const data = response.data.success ? response.data.data : response.data;
      setRfps(data.rfps || []);
      setError(null);
    } catch (err) {
      setError('Failed to load RFPs');
      console.error(err);
      setRfps([]); // Set empty array on error
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

  const stats = {
    total: rfps.length,
    sent: rfps.filter(r => r.status === 'sent').length,
    draft: rfps.filter(r => r.status === 'draft').length,
    closed: rfps.filter(r => r.status === 'closed').length,
  };

  return (
    <div className="dashboard">
      {loading ? (
        <div className="loading">Loading RFPs...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="dashboard-header">
            <h1 className="dashboard-title">📊 Dashboard</h1>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-label">Total RFPs</div>
              <div className="stat-value">{stats.total}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Sent</div>
              <div className="stat-value">{stats.sent}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Draft</div>
              <div className="stat-value">{stats.draft}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Closed</div>
              <div className="stat-value">{stats.closed}</div>
            </div>
          </div>

          <div className="card">
            <h2>📋 All RFPs</h2>
            {rfps.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No RFPs Yet</h3>
                <p>Create your first RFP to get started!</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {rfps.map((rfp) => (
                  <div
                    key={rfp.id}
                    className="rfp-card"
                    onClick={() => navigate(`/rfp/${rfp.id}`)}
                  >
                    <div className="rfp-card-header">
                      <h3 className="rfp-card-title">{rfp.title}</h3>
                      <span className={`badge ${getStatusBadge(rfp.status)}`}>
                        {rfp.status}
                      </span>
                    </div>
                    <div className="rfp-card-meta">
                      <div className="rfp-meta-item">
                        <span>💰</span>
                        <strong>Budget:</strong> {formatCurrency(rfp.budget)}
                      </div>
                      <div className="rfp-meta-item">
                        <span>📅</span>
                        <strong>Deadline:</strong> {formatDate(rfp.deadline)}
                      </div>
                      <div className="rfp-meta-item">
                        <span>🕐</span>
                        <strong>Created:</strong> {formatDate(rfp.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default Dashboard;

