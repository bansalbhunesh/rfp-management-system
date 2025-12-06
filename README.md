# 🚀 AI-Powered RFP Management System

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-18.2.0-blue.svg)

**An intelligent, end-to-end web application that streamlines the Request for Proposal (RFP) workflow using AI to automate procurement processes.**

[Features](#-key-features) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Architecture](#-architecture) • [API Reference](#-api-reference)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Architecture](#-architecture)
- [API Reference](#-api-reference)
- [Configuration](#-configuration)
- [AI Integration](#-ai-integration)
- [Database Schema](#-database-schema)
- [Frontend Components](#-frontend-components)
- [Troubleshooting](#-troubleshooting)
- [Future Enhancements](#-future-enhancements)

---

## 🎯 Overview

The AI-Powered RFP Management System is a comprehensive solution designed to help procurement managers streamline their Request for Proposal workflow. The system leverages artificial intelligence to automate time-consuming tasks such as:

- **Natural Language Processing**: Convert free-form procurement descriptions into structured RFPs
- **Intelligent Parsing**: Automatically extract proposal data from vendor email responses
- **AI-Assisted Comparison**: Generate comprehensive proposal comparisons with scoring and recommendations

### What Problem Does It Solve?

Traditional RFP management involves:
- ❌ Manual data entry from unstructured descriptions
- ❌ Time-consuming proposal review and comparison
- ❌ Error-prone manual extraction of pricing and terms
- ❌ Lack of standardized comparison metrics

**Our Solution:**
- ✅ AI-powered natural language to structured RFP conversion
- ✅ Automated vendor response parsing
- ✅ Intelligent proposal comparison with multi-dimensional scoring
- ✅ Streamlined email-based workflow

---

## ✨ Key Features

### 🤖 AI-Powered Features

1. **Natural Language to RFP Conversion**
   - Describe your procurement needs in plain English
   - AI extracts structured data: budget, deadlines, requirements, terms
   - Automatic requirement parsing with quantities and specifications

2. **Intelligent Vendor Response Parsing**
   - Automatically extracts pricing, line items, and terms from email responses
   - Handles various email formats (free-form text, tables, structured data)
   - Robust error handling for incomplete or ambiguous responses

3. **AI-Assisted Proposal Comparison**
   - Multi-dimensional scoring (price, terms, completeness)
   - Automated recommendation with detailed reasoning
   - Side-by-side comparison of all proposals

### 📧 Email Integration

- **Send RFPs via Email**: Automatically format and send RFPs to selected vendors
- **Receive Responses**: Check inbox for vendor responses and auto-process them
- **Email Matching**: Intelligent vendor matching based on email addresses

### 💾 Database Management

- **Flexible Storage**: Supports both PostgreSQL and SQLite
- **Auto-Fallback**: Works out of the box with SQLite (no setup required)
- **Schema Evolution**: JSONB fields allow flexible requirements storage

### 🎨 User Interface

- **Modern Web Interface**: Clean, intuitive React-based UI
- **Real-time Updates**: Instant feedback on all operations
- **Responsive Design**: Works on desktop and tablet devices
- **Toast Notifications**: User-friendly success/error messages

### 🔧 Developer-Friendly

- **Zero Configuration**: Works immediately with SQLite
- **Optional Services**: Email and OpenAI are optional (graceful degradation)
- **Clear Error Messages**: Helpful error messages guide configuration
- **Hot Reload**: Automatic server restart on code changes

---

## 🛠 Tech Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2.0 | UI framework |
| **React Router** | 6.20.1 | Client-side routing |
| **Axios** | 1.6.2 | HTTP client for API calls |
| **CSS3** | - | Styling (no external framework) |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | ≥18.0.0 | Runtime environment |
| **Express** | 4.18.2 | Web framework |
| **PostgreSQL** | ≥12.0 | Primary database (optional) |
| **SQLite** | 9.2.2 | Fallback database (default) |
| **OpenAI API** | 4.20.1 | GPT-4 Turbo for AI features |
| **Nodemailer** | 6.9.7 | SMTP email sending |
| **IMAP** | 0.8.19 | Email receiving |
| **Mailparser** | 3.6.5 | Email parsing |

### Development Tools

| Tool | Purpose |
|------|---------|
| **Nodemon** | Auto-restart server on code changes |
| **Concurrently** | Run frontend and backend together |
| **React Scripts** | Frontend build tooling |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18 or higher ([Download](https://nodejs.org/))
- **PostgreSQL** v12+ (optional - SQLite used by default)
- **OpenAI API Key** (optional - local parsing fallback available)
- **Email Account** (optional - for email features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rfp-management-system-1
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   
   # Install frontend dependencies
   cd frontend && npm install && cd ..
   ```

3. **Run the application**
   ```bash
   # From root directory - runs both frontend and backend
   npm run dev
   ```

4. **Access the application**
   - **Frontend**: http://localhost:3000
   - **Backend API**: http://localhost:3001
   - **Health Check**: http://localhost:3001/health

**That's it!** The application runs immediately with SQLite and local parsing. No configuration required!

---

## 📁 Project Structure

```
rfp-management-system-1/
│
├── backend/                    # Backend API server
│   ├── controllers/           # Request handlers
│   │   ├── rfpController.js   # RFP CRUD operations
│   │   ├── vendorController.js # Vendor management
│   │   └── proposalController.js # Proposal processing
│   ├── database/              # Database configuration
│   │   ├── connection.js      # DB connection (PostgreSQL/SQLite)
│   │   ├── schema.sql         # PostgreSQL schema
│   │   └── schema.sqlite.sql  # SQLite schema
│   ├── routes/                # API route definitions
│   │   ├── rfpRoutes.js
│   │   ├── vendorRoutes.js
│   │   └── proposalRoutes.js
│   ├── services/              # Business logic services
│   │   ├── aiService.js       # OpenAI integration
│   │   └── emailService.js   # Email sending/receiving
│   ├── utils/                 # Utility functions
│   │   ├── envValidator.js    # Environment validation
│   │   └── responseHelper.js  # API response formatting
│   ├── scripts/               # Utility scripts
│   │   └── seed.js          # Database seeding
│   ├── db/                    # SQLite database location
│   │   └── local.sqlite
│   ├── server.js              # Express server entry point
│   └── package.json
│
├── frontend/                   # React frontend application
│   ├── public/                # Static files
│   │   └── index.html
│   ├── src/
│   │   ├── api/               # API client
│   │   │   └── api.js        # Axios configuration
│   │   ├── components/       # React components
│   │   │   ├── Dashboard.js  # Main dashboard
│   │   │   ├── RFPCreate.js  # RFP creation form
│   │   │   ├── RFPDetail.js  # RFP detail view
│   │   │   ├── VendorManagement.js # Vendor CRUD
│   │   │   └── MockDemo.js   # Demo/testing page
│   │   ├── utils/            # Frontend utilities
│   │   │   └── toast.js      # Toast notifications
│   │   ├── App.js            # Main app component
│   │   ├── App.css           # Global styles
│   │   └── index.js          # React entry point
│   └── package.json
│
├── package.json               # Root package.json
├── README.md                  # This file
└── start.sh / start.bat      # Startup scripts
```

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Create RFP│  │Vendors   │  │Demo      │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTP/REST API
┌───────────────────────▼─────────────────────────────────────┐
│                    Backend (Express)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Controllers   │  │Services      │  │Utils         │      │
│  │- RFP          │  │- AI Service │  │- Validators  │      │
│  │- Vendor       │  │- Email       │  │- Helpers     │      │
│  │- Proposal     │  │              │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└───────┬──────────────────┬──────────────────┬───────────────┘
        │                  │                  │
┌───────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐
│  Database    │  │  OpenAI API     │  │  Email     │
│  (PostgreSQL │  │  (GPT-4 Turbo) │  │  (SMTP/    │
│   / SQLite)  │  │                 │  │   IMAP)    │
└──────────────┘  └─────────────────┘  └────────────┘
```

### Data Flow

#### 1. RFP Creation Flow
```
User Input (Natural Language)
    ↓
Frontend → POST /api/rfps/create-from-natural-language
    ↓
Backend → AI Service (OpenAI GPT-4)
    ↓
AI Parses → Structured RFP Data
    ↓
Database → Save RFP
    ↓
Response → Frontend displays RFP
```

#### 2. Vendor Response Processing Flow
```
Vendor Email Response
    ↓
User clicks "Check for New Responses"
    ↓
Backend → IMAP → Fetch Unread Emails
    ↓
Email Parser → Extract Email Body
    ↓
AI Service → Parse Proposal Data
    ↓
Database → Match Vendor → Save Proposal
    ↓
Frontend → Display Proposal
```

#### 3. Proposal Comparison Flow
```
User clicks "Compare Proposals"
    ↓
Frontend → GET /api/proposals/compare/:rfpId
    ↓
Backend → Fetch RFP + All Proposals
    ↓
AI Service → Generate Comparison Scores
    ↓
Database → Save Scores
    ↓
Response → Frontend displays comparison
```

---

## 📡 API Reference

### Base URL
```
http://localhost:3001/api
```

### Response Format

All API responses follow this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message",
  "code": 400
}
```

### Endpoints

#### RFPs

##### Create RFP from Natural Language
```http
POST /api/rfps/create-from-natural-language
Content-Type: application/json

Request Body:
{
  "naturalLanguage": "I need to procure laptops and monitors for our new office. Budget is $50,000 total. Need delivery within 30 days. We need 20 laptops with 16GB RAM and 15 monitors 27-inch. Payment terms should be net 30, and we need at least 1 year warranty."
}

Response:
{
  "success": true,
  "data": {
    "rfp": {
      "id": 1,
      "title": "Office Equipment Procurement",
      "description": "...",
      "budget": 50000,
      "deadline": "2024-02-15",
      "delivery_date": "2024-01-30",
      "payment_terms": "Net 30",
      "warranty_period": "1 year",
      "requirements": [...],
      "status": "draft",
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

##### Get All RFPs
```http
GET /api/rfps

Response:
{
  "success": true,
  "data": {
    "rfps": [
      {
        "id": 1,
        "title": "...",
        "status": "sent",
        ...
      }
    ]
  }
}
```

##### Get Single RFP
```http
GET /api/rfps/:id

Response:
{
  "success": true,
  "data": {
    "rfp": { ... },
    "proposals": [ ... ],
    "scores": [ ... ]
  }
}
```

##### Send RFP to Vendors
```http
POST /api/rfps/send
Content-Type: application/json

Request Body:
{
  "rfpId": 1,
  "vendorIds": [1, 2, 3]
}

Response:
{
  "success": true,
  "data": {
    "results": [
      {
        "vendorId": 1,
        "vendorName": "Tech Solutions Inc.",
        "success": true,
        "emailSent": true,
        "messageId": "...",
        "warning": null
      }
    ]
  }
}
```

#### Vendors

##### Get All Vendors
```http
GET /api/vendors

Response:
{
  "success": true,
  "data": {
    "vendors": [
      {
        "id": 1,
        "name": "Tech Solutions Inc.",
        "email": "contact@techsolutions.com",
        "contact_person": "John Smith",
        "phone": "1234567890",
        "address": "123 Tech Street...",
        "created_at": "..."
      }
    ]
  }
}
```

##### Create Vendor
```http
POST /api/vendors
Content-Type: application/json

Request Body:
{
  "name": "Tech Solutions Inc.",
  "email": "contact@techsolutions.com",
  "contact_person": "John Smith",
  "phone": "1234567890",
  "address": "123 Tech Street, City, State, ZIP"
}

Validation Rules:
- name: Required, 2-100 characters
- email: Required, valid email format, max 255 characters
- phone: Optional, exactly 10 digits (non-digits removed)
- contact_person: Optional, max 100 characters
- address: Optional, max 500 characters
```

##### Update Vendor
```http
PUT /api/vendors/:id
Content-Type: application/json

Request Body: (same as create)
```

##### Delete Vendor
```http
DELETE /api/vendors/:id
```

#### Proposals

##### Process Vendor Response
```http
POST /api/proposals/process
Content-Type: application/json

Request Body:
{
  "emailBody": "Thank you for the RFP. We are pleased to submit our proposal...",
  "emailSubject": "Re: RFP: Office Equipment",
  "fromEmail": "contact@techsolutions.com",
  "messageId": "unique-message-id"
}
```

##### Compare Proposals
```http
GET /api/proposals/compare/:rfpId

Response:
{
  "success": true,
  "data": {
    "comparison": {
      "summary": "Comparison of 3 proposals...",
      "best_proposal_id": 1,
      "proposals": [
        {
          "id": 1,
          "vendor_id": 1,
          "overall_score": 85.5,
          "price_score": 90,
          "terms_score": 80,
          "completeness_score": 87,
          "recommendation_reason": "Best overall value..."
        }
      ]
    },
    "proposals": [ ... ]
  }
}
```

##### Check for New Emails
```http
POST /api/proposals/check-emails

Response:
{
  "success": true,
  "data": {
    "processed": 2,
    "total": 3,
    "emails": [
      {
        "from": "vendor@example.com",
        "subject": "Re: RFP: ...",
        "processed": true
      }
    ],
    "message": "Processed 2 of 3 email(s)"
  }
}
```

---

## ⚙️ Configuration

### Environment Variables

Create a `backend/.env` file (optional - application works without it):

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Optional - SQLite used if not set)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfp_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# OpenAI Configuration (Optional - local parsing used if not set)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email SMTP Configuration (Optional - for sending RFPs)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com

# Email IMAP Configuration (Optional - for receiving responses)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# Application Email
APP_EMAIL=your_email@gmail.com
```

### Configuration Options

#### Option 1: Zero Configuration (Default)
- Uses SQLite database (auto-created)
- Uses local parsing fallback (no OpenAI required)
- No email sending/receiving
- **Works immediately after `npm run dev`**

#### Option 2: Full Configuration
- PostgreSQL database
- OpenAI API for AI features
- Email sending/receiving via SMTP/IMAP

### Gmail Setup (If Using Email)

1. **Enable 2-Factor Authentication** on your Google Account
2. **Generate App Password**:
   - Go to Google Account → Security
   - Enable 2-Step Verification
   - Go to App passwords
   - Create password for "Mail"
3. **Use App Password** in `.env` (not your regular password)

---

## 🤖 AI Integration

### AI Models Used

- **OpenAI GPT-4 Turbo** with JSON mode
- **Temperature Settings**: 0.2-0.3 (for consistency and accuracy)

### AI Features

#### 1. Natural Language to RFP Conversion

**Purpose**: Convert free-form procurement descriptions into structured RFPs

**Process**:
1. User enters natural language description
2. System sends to GPT-4 Turbo with structured prompt
3. AI extracts: title, description, budget, dates, requirements, terms
4. System validates and saves to database

**Example Input**:
```
"I need to procure laptops and monitors for our new office. 
Budget is $50,000 total. Need delivery within 30 days. 
We need 20 laptops with 16GB RAM and 15 monitors 27-inch. 
Payment terms should be net 30, and we need at least 1 year warranty."
```

**Example Output**:
```json
{
  "title": "Office Equipment Procurement",
  "budget": 50000,
  "delivery_date": "2024-01-30",
  "payment_terms": "Net 30",
  "warranty_period": "1 year",
  "requirements": [
    { "item": "laptops", "quantity": 20, "specs": "16GB RAM" },
    { "item": "monitors", "quantity": 15, "specs": "27-inch" }
  ]
}
```

#### 2. Vendor Response Parsing

**Purpose**: Extract structured proposal data from vendor email responses

**Process**:
1. System receives vendor email
2. Extracts email body text
3. Sends to GPT-4 Turbo with parsing prompt
4. AI extracts: pricing, line items, terms, dates
5. System matches vendor and saves proposal

**Handles**:
- Free-form text responses
- Table-formatted data
- Incomplete information (returns null)
- Various email formats

#### 3. Proposal Comparison

**Purpose**: Generate comprehensive proposal comparisons with scoring

**Process**:
1. System fetches RFP and all proposals
2. Sends full context to GPT-4 Turbo
3. AI generates multi-dimensional scores
4. System saves scores and recommendations

**Scoring Dimensions**:
- **Price Score** (0-100): Lower price = higher score (within budget)
- **Terms Score** (0-100): Alignment with RFP requirements
- **Completeness Score** (0-100): How well proposal meets all requirements
- **Overall Score**: Weighted combination

**Output Includes**:
- Individual scores for each dimension
- Overall recommendation
- Detailed reasoning
- Key differences summary

### Fallback Behavior

If OpenAI API key is not configured:
- **RFP Creation**: Uses local regex-based parsing (basic extraction)
- **Response Parsing**: Uses local parsing (limited accuracy)
- **Comparison**: Returns basic price comparison only

---

## 🗄 Database Schema

### Tables

#### `vendors`
Stores vendor master data.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL/INTEGER | Primary key |
| `name` | VARCHAR(255) | Vendor name |
| `email` | VARCHAR(255) | Unique email address |
| `contact_person` | VARCHAR(255) | Contact person name |
| `phone` | VARCHAR(50) | Phone number |
| `address` | TEXT | Physical address |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `rfps`
Stores RFP definitions.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL/INTEGER | Primary key |
| `title` | VARCHAR(255) | RFP title |
| `description` | TEXT | Full description |
| `budget` | DECIMAL(15,2) | Total budget |
| `deadline` | DATE | Submission deadline |
| `delivery_date` | DATE | Required delivery date |
| `payment_terms` | VARCHAR(255) | Payment terms |
| `warranty_period` | VARCHAR(255) | Warranty requirements |
| `requirements` | JSONB/TEXT | Structured requirements (JSON) |
| `status` | VARCHAR(50) | Status: draft, sent, closed |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### `rfp_vendors`
Tracks RFP-vendor relationships (many-to-many).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL/INTEGER | Primary key |
| `rfp_id` | INTEGER | Foreign key to rfps |
| `vendor_id` | INTEGER | Foreign key to vendors |
| `sent_at` | TIMESTAMP | When RFP was sent |
| `email_subject` | VARCHAR(255) | Email subject sent |
| `email_body` | TEXT | Email body sent |

#### `proposals`
Stores vendor proposal responses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL/INTEGER | Primary key |
| `rfp_id` | INTEGER | Foreign key to rfps |
| `vendor_id` | INTEGER | Foreign key to vendors |
| `email_message_id` | VARCHAR(255) | Email message ID |
| `email_subject` | VARCHAR(255) | Email subject |
| `email_body` | TEXT | Original email body |
| `total_price` | DECIMAL(15,2) | Total proposal price |
| `line_items` | JSONB/TEXT | Line items (JSON array) |
| `payment_terms` | VARCHAR(255) | Proposed payment terms |
| `warranty_period` | VARCHAR(255) | Proposed warranty |
| `delivery_date` | DATE | Proposed delivery date |
| `additional_notes` | TEXT | Additional information |
| `extracted_data` | JSONB/TEXT | Full extracted data (JSON) |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |
| UNIQUE(`rfp_id`, `vendor_id`) | | One proposal per vendor per RFP |

#### `proposal_scores`
Stores AI-generated comparison scores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL/INTEGER | Primary key |
| `rfp_id` | INTEGER | Foreign key to rfps |
| `proposal_id` | INTEGER | Foreign key to proposals |
| `overall_score` | DECIMAL(5,2) | Overall score (0-100) |
| `price_score` | DECIMAL(5,2) | Price score (0-100) |
| `terms_score` | DECIMAL(5,2) | Terms score (0-100) |
| `completeness_score` | DECIMAL(5,2) | Completeness score (0-100) |
| `recommendation_reason` | TEXT | AI reasoning |
| `created_at` | TIMESTAMP | Creation timestamp |

### Database Compatibility

The system supports both PostgreSQL and SQLite:

- **PostgreSQL**: Full feature support, JSONB for flexible storage
- **SQLite**: Auto-fallback, works without configuration, TEXT for JSON

The `connection.js` file automatically:
- Detects which database to use based on environment variables
- Converts SQL syntax differences (NOW() → datetime('now'))
- Handles parameter placeholders ($1 → ?)
- Manages RETURNING clauses

---

## 🎨 Frontend Components

### Dashboard (`/`)
- Displays all RFPs in a table
- Shows status badges (draft, sent, closed)
- Quick navigation to create new RFP
- Click "View" to see RFP details

### Create RFP (`/create-rfp`)
- Natural language input textarea
- Example text button for quick start
- Parse button to preview extracted data
- Create button to save RFP
- Auto-navigates to RFP detail page after creation

### RFP Detail (`/rfp/:id`)
- Full RFP information display
- Send RFP to vendors form
- List of received proposals
- Compare proposals button (requires 2+ proposals)
- Check for new email responses button

### Vendor Management (`/vendors`)
- List all vendors
- Add new vendor form
- Edit existing vendors
- Delete vendors
- Form validation (email, phone, etc.)

### Demo Page (`/demo`)
- Simulate vendor responses
- Test proposal processing
- Useful for testing without email setup

---

## 🔧 Troubleshooting

### Common Issues

#### 1. "Vendor not found" when checking emails

**Problem**: Email sender doesn't match vendor email in database

**Solution**:
- Check vendor email in Vendors page
- Ensure reply comes from exact same email address
- Email matching is case-insensitive but must match exactly

#### 2. IMAP timeout errors

**Problem**: IMAP connection times out

**Solutions**:
- Check IMAP settings in `.env` file
- For Gmail, ensure App Password is used (not regular password)
- Verify IMAP is enabled in email account settings
- Use `/demo` page to simulate responses instead

#### 3. "RFP not found" after creation

**Problem**: Race condition - frontend navigates before database commit

**Solution**: 
- Wait a moment and refresh
- Navigate back to dashboard and click on RFP
- This is rare and usually resolves automatically

#### 4. Email not sending

**Problem**: SMTP configuration incomplete

**Solutions**:
- Check SMTP settings in `.env`
- For Gmail, use App Password (not regular password)
- Verify SMTP_HOST, SMTP_USER, SMTP_PASSWORD are set
- Check server logs for specific error messages

#### 5. OpenAI API errors

**Problem**: API key invalid or rate limited

**Solutions**:
- Verify OPENAI_API_KEY in `.env`
- Check API key has sufficient credits
- System will use local parsing fallback if API fails

### Getting Help

1. **Check Server Logs**: Backend logs show detailed error messages
2. **Check Browser Console**: Frontend errors appear in browser DevTools
3. **Verify Configuration**: Ensure `.env` file is in `backend/` directory
4. **Test Endpoints**: Use `curl` or Postman to test API directly

---

## 🚀 Future Enhancements

### Planned Features

1. **Real-time Email Processing**
   - Webhook integration (SendGrid, Mailgun)
   - Background job queue for email processing
   - Automatic email checking on intervals

2. **Attachment Support**
   - PDF parsing for proposals
   - Image OCR for scanned documents
   - Excel/CSV import for bulk data

3. **Enhanced AI Features**
   - Multi-turn conversation for RFP refinement
   - Automated follow-up email generation
   - Risk analysis and compliance checking
   - Custom AI prompts per organization

4. **Advanced Comparison**
   - Customizable scoring weights
   - Historical trend analysis
   - Side-by-side visual comparison
   - Export comparison reports

5. **Workflow Improvements**
   - RFP templates and cloning
   - Automated deadline reminders
   - Vendor response tracking dashboard
   - Email templates customization

6. **Production Readiness**
   - User authentication and authorization
   - Multi-tenant support
   - Audit logging
   - Rate limiting and API security
   - Docker containerization
   - CI/CD pipeline

7. **UI/UX Enhancements**
   - Dark mode
   - Advanced filtering and search
   - Data visualization charts
   - Mobile-responsive design improvements

---

## 📝 License

MIT License - see LICENSE file for details

---

## 👤 Author

Built as an SDE assignment demonstrating:
- Full-stack development (React + Node.js)
- AI/ML integration (OpenAI GPT-4)
- Database design (PostgreSQL/SQLite)
- Email integration (SMTP/IMAP)
- RESTful API design
- Modern web development practices

---

## 🙏 Acknowledgments

- **OpenAI** for GPT-4 Turbo API
- **React Team** for the excellent framework
- **Express.js** for the robust backend framework
- **PostgreSQL** and **SQLite** communities

---

<div align="center">

**Made with ❤️ using AI**

[Report Bug](https://github.com/your-repo/issues) • [Request Feature](https://github.com/your-repo/issues) • [Documentation](#-documentation)

</div>
