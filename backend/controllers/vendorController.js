const pool = require('../database/connection');

/**
 * Get all vendors
 */
async function getAllVendors(req, res) {
  try {
    const result = await pool.query('SELECT * FROM vendors ORDER BY name');
    res.json({ vendors: result.rows });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
}

/**
 * Create vendor
 */
async function createVendor(req, res) {
  try {
    const { name, email, contact_person, phone, address } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    const result = await pool.query(
      `INSERT INTO vendors (name, email, contact_person, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, contact_person || null, phone || null, address || null]
    );

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({ error: 'Vendor with this email already exists' });
    }
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
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
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ vendor: result.rows[0] });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
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
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
}

module.exports = {
  getAllVendors,
  createVendor,
  updateVendor,
  deleteVendor,
};

