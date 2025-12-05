-- RFP Management System Database Schema

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFPs table
CREATE TABLE IF NOT EXISTS rfps (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    budget DECIMAL(15, 2),
    deadline DATE,
    delivery_date DATE,
    payment_terms VARCHAR(255),
    warranty_period VARCHAR(255),
    requirements JSONB, -- Flexible JSON structure for various requirements
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFP-Vendor relationships (many-to-many)
CREATE TABLE IF NOT EXISTS rfp_vendors (
    id SERIAL PRIMARY KEY,
    rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    sent_at TIMESTAMP,
    email_subject VARCHAR(500),
    email_body TEXT,
    UNIQUE(rfp_id, vendor_id)
);

-- Proposals table (vendor responses)
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    rfp_id INTEGER REFERENCES rfps(id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(id) ON DELETE CASCADE,
    email_message_id VARCHAR(500), -- For tracking the original email
    email_subject VARCHAR(500),
    email_body TEXT,
    total_price DECIMAL(15, 2),
    line_items JSONB, -- Array of items with prices
    payment_terms VARCHAR(255),
    warranty_period VARCHAR(255),
    delivery_date DATE,
    additional_notes TEXT,
    extracted_data JSONB, -- Full AI-extracted structured data
    status VARCHAR(50) DEFAULT 'received', -- received, reviewed, accepted, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rfp_id, vendor_id)
);

-- Comparison scores (AI-generated)
CREATE TABLE IF NOT EXISTS proposal_scores (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE UNIQUE,
    overall_score DECIMAL(5, 2), -- 0-100
    price_score DECIMAL(5, 2),
    terms_score DECIMAL(5, 2),
    completeness_score DECIMAL(5, 2),
    recommendation_reason TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_rfps_status ON rfps(status);
CREATE INDEX IF NOT EXISTS idx_proposals_rfp_id ON proposals(rfp_id);
CREATE INDEX IF NOT EXISTS idx_proposals_vendor_id ON proposals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_rfp_vendors_rfp_id ON rfp_vendors(rfp_id);

