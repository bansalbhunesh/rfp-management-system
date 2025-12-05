import React, { useState, useEffect } from 'react';
import { getAllVendors, createVendor, updateVendor, deleteVendor } from '../api/api';
import './VendorManagement.css';

function VendorManagement() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingVendor, setEditingVendor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    contact_person: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await getAllVendors();
      // Handle new API response format { success, data } or old format
      const data = response.data.success ? response.data.data : response.data;
      setVendors(data.vendors || []);
      setError(null);
    } catch (err) {
      setError('Failed to load vendors');
      console.error(err);
      setVendors([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      if (editingVendor) {
        const response = await updateVendor(editingVendor.id, formData);
        const message = response.data.success 
          ? (response.data.message || 'Vendor updated successfully')
          : 'Vendor updated successfully';
        setSuccess(message);
      } else {
        const response = await createVendor(formData);
        const message = response.data.success 
          ? (response.data.message || 'Vendor created successfully')
          : 'Vendor created successfully';
        setSuccess(message);
      }
      
      setShowForm(false);
      setEditingVendor(null);
      setFormData({
        name: '',
        email: '',
        contact_person: '',
        phone: '',
        address: '',
      });
      loadVendors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save vendor');
    }
  };

  const handleEdit = (vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      contact_person: vendor.contact_person || '',
      phone: vendor.phone || '',
      address: vendor.address || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this vendor?')) {
      return;
    }

    try {
      await deleteVendor(id);
      setSuccess('Vendor deleted successfully');
      loadVendors();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete vendor');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingVendor(null);
    setFormData({
      name: '',
      email: '',
      contact_person: '',
      phone: '',
      address: '',
    });
  };

  if (loading) {
    return <div className="loading">Loading vendors...</div>;
  }

  return (
    <div className="vendor-management">
      <div className="card">
        <div className="flex-between">
          <h2>Vendor Management</h2>
          <button
            className="button"
            onClick={() => {
              setShowForm(true);
              setEditingVendor(null);
            }}
          >
            Add Vendor
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        {showForm && (
          <div className="vendor-form mt-2">
            <h3>{editingVendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label htmlFor="name">Name *</label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="email">Email *</label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="input-group">
                <label htmlFor="contact_person">Contact Person</label>
                <input
                  id="contact_person"
                  type="text"
                  value={formData.contact_person}
                  onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="input-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="button-group">
                <button type="submit" className="button">
                  {editingVendor ? 'Update' : 'Create'} Vendor
                </button>
                <button type="button" className="button button-secondary" onClick={handleCancel}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {vendors.length === 0 ? (
          <p className="mt-2">No vendors yet. Add your first vendor to get started.</p>
        ) : (
          <table className="table mt-2">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr key={vendor.id}>
                  <td>{vendor.name}</td>
                  <td>{vendor.email}</td>
                  <td>{vendor.contact_person || 'N/A'}</td>
                  <td>{vendor.phone || 'N/A'}</td>
                  <td>
                    <div className="flex gap-1">
                      <button
                        className="button button-secondary"
                        onClick={() => handleEdit(vendor)}
                      >
                        Edit
                      </button>
                      <button
                        className="button button-secondary"
                        onClick={() => handleDelete(vendor.id)}
                      >
                        Delete
                      </button>
                    </div>
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

export default VendorManagement;

