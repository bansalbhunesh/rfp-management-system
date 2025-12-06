const pool = require('../database/connection');
const { success, error: errorResponse } = require('../utils/responseHelper');

/**
 * Get all vendors
 */
async function getAllVendors(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name');
    return res.json(success({ vendors: result.rows }));
  } catch (err) {
    console.error('Error fetching vendors:', err);
    return res.status(500).json(errorResponse('Failed to fetch vendors', null, 500));
  }
}

/**
 * Create vendor
 */
// Validation helper functions
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length === 10;
}

async function createVendor(req, res) {
  try {
    let { name, email, contact_person, phone, address } = req.body;

    // Trim and clean inputs
    name = name ? name.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    contact_person = contact_person ? contact_person.trim() : '';
    phone = phone ? phone.replace(/\D/g, '') : '';
    address = address ? address.trim() : '';

    // Validation
    if (!name || name.length === 0) {
      return res.status(400).json(errorResponse('Name is required'));
    }
    if (name.length < 2) {
      return res.status(400).json(errorResponse('Name must be at least 2 characters'));
    }
    if (name.length > 100) {
      return res.status(400).json(errorResponse('Name must be less than 100 characters'));
    }

    if (!email || email.length === 0) {
      return res.status(400).json(errorResponse('Email is required'));
    }
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Please enter a valid email address'));
    }
    if (email.length > 255) {
      return res.status(400).json(errorResponse('Email must be less than 255 characters'));
    }

    if (contact_person && contact_person.length > 100) {
      return res.status(400).json(errorResponse('Contact person name must be less than 100 characters'));
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json(errorResponse('Phone number must be exactly 10 digits'));
    }

    if (address && address.length > 500) {
      return res.status(400).json(errorResponse('Address must be less than 500 characters'));
    }

    const result = await pool.query(
      `INSERT INTO vendors (name, email, contact_person, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, contact_person || null, phone || null, address || null]
    );

    return res.json(success({ vendor: result.rows[0] }, 'Vendor created successfully'));
  } catch (err) {
    if (err.code === '23505') { // Unique violation
      return res.status(400).json(errorResponse('Vendor with this email already exists'));
    }
    console.error('Error creating vendor:', err);
    return res.status(500).json(errorResponse('Failed to create vendor', null, 500));
  }
}

/**
 * Update vendor
 */
async function updateVendor(req, res) {
  try {
    const { id } = req.params;
    let { name, email, contact_person, phone, address } = req.body;

    // Trim and clean inputs
    name = name ? name.trim() : '';
    email = email ? email.trim().toLowerCase() : '';
    contact_person = contact_person ? contact_person.trim() : '';
    phone = phone ? phone.replace(/\D/g, '') : '';
    address = address ? address.trim() : '';

    // Validation (same as create)
    if (!name || name.length === 0) {
      return res.status(400).json(errorResponse('Name is required'));
    }
    if (name.length < 2) {
      return res.status(400).json(errorResponse('Name must be at least 2 characters'));
    }
    if (name.length > 100) {
      return res.status(400).json(errorResponse('Name must be less than 100 characters'));
    }

    if (!email || email.length === 0) {
      return res.status(400).json(errorResponse('Email is required'));
    }
    if (!validateEmail(email)) {
      return res.status(400).json(errorResponse('Please enter a valid email address'));
    }
    if (email.length > 255) {
      return res.status(400).json(errorResponse('Email must be less than 255 characters'));
    }

    if (contact_person && contact_person.length > 100) {
      return res.status(400).json(errorResponse('Contact person name must be less than 100 characters'));
    }

    if (phone && !validatePhone(phone)) {
      return res.status(400).json(errorResponse('Phone number must be exactly 10 digits'));
    }

    if (address && address.length > 500) {
      return res.status(400).json(errorResponse('Address must be less than 500 characters'));
    }

    const result = await pool.query(
      `UPDATE vendors
       SET name = $1, email = $2, contact_person = $3, phone = $4, address = $5, updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [name, email, contact_person, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Vendor not found', null, 404));
    }

    return res.json(success({ vendor: result.rows[0] }, 'Vendor updated successfully'));
  } catch (err) {
    console.error('Error updating vendor:', err);
    return res.status(500).json(errorResponse('Failed to update vendor', null, 500));
  }
}

/**
 * Delete vendor
 */
async function deleteVendor(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM vendors WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(errorResponse('Vendor not found', null, 404));
    }

    return res.json(success(null, 'Vendor deleted successfully'));
  } catch (err) {
    console.error('Error deleting vendor:', err);
    return res.status(500).json(errorResponse('Failed to delete vendor', null, 500));
  }
}

module.exports = {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};

