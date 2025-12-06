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

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    if (!phone) return true; // Phone is optional
    // Remove all non-digit characters
    const digitsOnly = phone.replace(/\D/g, '');
    // Check if it's exactly 10 digits
    return digitsOnly.length === 10;
  };

  const validateForm = () => {
    // Name validation
    if (!formData.name || formData.name.trim().length === 0) {
      return 'Name is required';
    }
    if (formData.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (formData.name.length > 100) {
      return 'Name must be less than 100 characters';
    }

    // Email validation
    if (!formData.email || formData.email.trim().length === 0) {
      return 'Email is required';
    }
    if (!validateEmail(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (formData.email.length > 255) {
      return 'Email must be less than 255 characters';
    }

    // Contact person validation (optional)
    if (formData.contact_person && formData.contact_person.length > 100) {
      return 'Contact person name must be less than 100 characters';
    }

    // Phone validation
    if (formData.phone && !validatePhone(formData.phone)) {
      return 'Phone number must be exactly 10 digits';
    }

    // Address validation (optional)
    if (formData.address && formData.address.length > 500) {
      return 'Address must be less than 500 characters';
    }

    return null; // No errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Clean phone number (remove non-digits)
    const cleanedFormData = {
      ...formData,
      phone: formData.phone ? formData.phone.replace(/\D/g, '') : '',
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      contact_person: formData.contact_person ? formData.contact_person.trim() : '',
      address: formData.address ? formData.address.trim() : '',
    };

    try {
      if (editingVendor) {
        const response = await updateVendor(editingVendor.id, cleanedFormData);
        const message = response.data.success 
          ? (response.data.message || 'Vendor updated successfully')
          : 'Vendor updated successfully';
        setSuccess(message);
      } else {
        const response = await createVendor(cleanedFormData);
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
                  placeholder="vendor@example.com"
                  required
                />
                {formData.email && !validateEmail(formData.email) && (
                  <small style={{ color: '#e74c3c', marginTop: '0.25rem', display: 'block' }}>
                    Please enter a valid email address
                  </small>
                )}
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
                <label htmlFor="phone">Phone (10 digits)</label>
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow only digits, spaces, hyphens, and parentheses for formatting
                    const value = e.target.value.replace(/[^\d\s\-\(\)]/g, '');
                    setFormData({ ...formData, phone: value });
                  }}
                  placeholder="8360307465"
                  maxLength={15}
                />
                {formData.phone && formData.phone.replace(/\D/g, '').length !== 10 && (
                  <small style={{ color: '#e74c3c', marginTop: '0.25rem', display: 'block' }}>
                    Phone must be exactly 10 digits (currently: {formData.phone.replace(/\D/g, '').length} digits)
                  </small>
                )}
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

