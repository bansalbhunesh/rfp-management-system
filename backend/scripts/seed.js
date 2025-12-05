const pool = require('../database/connection');

async function seed() {
  try {
    console.log('Seeding database...');

    // Insert sample vendors
    const vendors = [
      {
        name: 'Tech Solutions Inc.',
        email: 'contact@techsolutions.com',
        contact_person: 'John Smith',
        phone: '+1-555-0101',
        address: '123 Tech Street, San Francisco, CA 94102',
      },
      {
        name: 'Global Equipment Co.',
        email: 'sales@globalequip.com',
        contact_person: 'Sarah Johnson',
        phone: '+1-555-0102',
        address: '456 Business Ave, New York, NY 10001',
      },
      {
        name: 'Office Supplies Pro',
        email: 'info@officesuppliespro.com',
        contact_person: 'Mike Davis',
        phone: '+1-555-0103',
        address: '789 Commerce Blvd, Chicago, IL 60601',
      },
    ];

    for (const vendor of vendors) {
      await pool.query(
        `INSERT INTO vendors (name, email, contact_person, phone, address)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO NOTHING`,
        [vendor.name, vendor.email, vendor.contact_person, vendor.phone, vendor.address]
      );
    }

    console.log('Seed data inserted successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();

