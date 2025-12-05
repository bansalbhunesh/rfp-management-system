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
async function createVendor(req, res) {
  try {
    const { name, email, contact_person, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json(errorResponse('Name and email are required'));
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
    const { name, email, contact_person, phone, address } = req.body;

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

