-- SQLite Schema for RFP Management System
-- This schema is automatically created when using SQLite fallback mode

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RFPs table
CREATE TABLE IF NOT EXISTS rfps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(15, 2),
    deadline DATE,
    delivery_date DATE,
    payment_terms VARCHAR(255),
    warranty_period VARCHAR(255),
    requirements TEXT, -- JSON string in SQLite
    status VARCHAR(50) DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RFP-Vendor relationships
CREATE TABLE IF NOT EXISTS rfp_vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfp_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    sent_at DATETIME,
    email_subject VARCHAR(500),
    email_body TEXT,
    UNIQUE(rfp_id, vendor_id),
    FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Proposals table
CREATE TABLE IF NOT EXISTS proposals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rfp_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    email_message_id VARCHAR(500),
    email_subject VARCHAR(500),
    email_body TEXT,
    total_price DECIMAL(15, 2),
    line_items TEXT, -- JSON string in SQLite
    payment_terms VARCHAR(255),
    warranty_period VARCHAR(255),
    delivery_date DATE,
    additional_notes TEXT,
    extracted_data TEXT, -- JSON string in SQLite
    status VARCHAR(50) DEFAULT 'received',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rfp_id, vendor_id),
    FOREIGN KEY (rfp_id) REFERENCES rfps(id) ON DELETE CASCADE,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE
);

-- Comparison scores
CREATE TABLE IF NOT EXISTS proposal_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    proposal_id INTEGER NOT NULL UNIQUE,
    overall_score DECIMAL(5, 2),
    price_score DECIMAL(5, 2),
    terms_score DECIMAL(5, 2),
    completeness_score DECIMAL(5, 2),
    recommendation_reason TEXT,
    ai_analysis TEXT, -- JSON string in SQLite
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_proposals_rfp_id ON proposals(rfp_id);
CREATE INDEX IF NOT EXISTS idx_proposals_vendor_id ON proposals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfp_vendors_rfp_id ON rfp_vendors(rfp_id);

