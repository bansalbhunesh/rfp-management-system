import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// RFPs
export const createRFPFromNaturalLanguage = (naturalLanguage) => {
  return api.post('/rfps/create-from-natural-language', { naturalLanguage });
};

export const getAllRFPs = () => {
  return api.get('/rfps');
};

export const getRFP = (id) => {
  return api.get(`/rfps/${id}`);
};

export const sendRFPToVendors = (rfpId, vendorIds) => {
  return api.post('/rfps/send', { rfpId, vendorIds });
};

// Vendors
export const getAllVendors = () => {
  return api.get('/vendors');
};

export const createVendor = (vendorData) => {
  return api.post('/vendors', vendorData);
};

export const updateVendor = (id, vendorData) => {
  return api.put(`/vendors/${id}`, vendorData);
};

export const deleteVendor = (id) => {
  return api.delete(`/vendors/${id}`);
};

// Proposals
export const processVendorResponse = (emailData) => {
  return api.post('/proposals/process', emailData);
};

export const compareProposals = (rfpId) => {
  return api.get(`/proposals/compare/${rfpId}`);
};

export const checkEmails = () => {
  return api.post('/proposals/check-emails');
};

export default api;

