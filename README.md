# AI-Powered RFP Management System

An end-to-end web application that streamlines the Request for Proposal (RFP) workflow using AI to automate procurement processes.

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Setup](#project-setup)
- [API Documentation](#api-documentation)
- [Architecture & Design Decisions](#architecture--design-decisions)
- [AI Integration](#ai-integration)
- [Email Configuration](#email-configuration)
- [Known Limitations](#known-limitations)
- [Future Enhancements](#future-enhancements)
- [AI Tools Usage](#ai-tools-usage)

## Project Overview

This system helps procurement managers:
1. **Create RFPs** from natural language descriptions using AI
2. **Manage vendors** and send RFPs via email
3. **Receive vendor responses** via email and automatically parse them with AI
4. **Compare proposals** with AI-assisted evaluation and recommendations

## Features

- ✅ Natural language to structured RFP conversion (AI-powered)
- ✅ Vendor master data management
- ✅ Email-based RFP distribution
- ✅ Automatic vendor response parsing (AI-powered)
- ✅ AI-assisted proposal comparison and scoring
- ✅ Modern, intuitive web interface

## 2. Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **CSS3** - Styling (no external CSS framework for simplicity)

### Backend
- **Node.js** with **Express** - REST API server
- **PostgreSQL** - Relational database
- **OpenAI GPT-4 Turbo** - AI/LLM integration
- **Nodemailer** - SMTP email sending
- **IMAP** - Email receiving
- **Mailparser** - Email parsing

### Development Tools
- **Nodemon** - Auto-restart for development
- **Concurrently** - Run frontend and backend together

## 1. Project Setup

### Prerequisites

- **Node.js** v18 or higher (`node --version` to check)
- **PostgreSQL** v12 or higher (optional - SQLite will be used if not configured)
- **OpenAI API Key** (optional - local parsing fallback available)
- **Email Account** with SMTP/IMAP access (optional - for email sending/receiving)

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd rfp-management-system
   ```

2. **Install dependencies**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   
   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Set up Database (Optional)**

   **Option A: Use PostgreSQL (Recommended for production)**
   ```bash
   # Create database
   createdb rfp_management
   
   # Run schema
   psql -d rfp_management -f backend/database/schema.sql
   ```
   
   **Option B: Use SQLite (Default - No setup required)**
   - The application will automatically use SQLite if PostgreSQL is not configured
   - Database file will be created at `backend/db/local.sqlite`

4. **Configure environment variables (Optional)**

   Create `backend/.env` file with the following variables:
   ```bash
   cd backend
   # Create .env file (copy the template below)
   ```

   Create `backend/.env` file (copy from `backend/.env.example`):
   ```env
   # Server
   PORT=3001
   NODE_ENV=development

   # Database (Optional - SQLite used if not set)
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=rfp_management
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password

   # OpenAI (Optional - local parsing used if not set)
   OPENAI_API_KEY=sk-your-openai-api-key

   # Email (Optional - for sending RFPs via email)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASSWORD=your_app_password
   SMTP_FROM=your_email@gmail.com

   # Email (Optional - for receiving vendor responses)
   IMAP_HOST=imap.gmail.com
   IMAP_PORT=993
   IMAP_USER=your_email@gmail.com
   IMAP_PASSWORD=your_app_password

   # Application
   APP_EMAIL=your_email@gmail.com
   ```

   **Note:** The application works without email configuration. RFPs are saved to the database and can be managed through the web interface. Email configuration is only needed if you want to send RFPs via email.

   **For Gmail users (if configuring email):**
   - Enable "Less secure app access" OR use an App Password
   - Generate App Password: Google Account → Security → 2-Step Verification → App passwords

5. **Seed initial data (optional)**
   ```bash
   cd backend
   npm run seed
   ```

6. **Run the application**

   The application works out of the box with SQLite and local parsing. No configuration required!

   **Option 1: Run both frontend and backend together**
   ```bash
   # From root directory
   npm run dev
   ```

   **Option 2: Run separately**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   
   **That's it!** The application is now running. You can:
   - Create RFPs from natural language
   - Manage vendors
   - Send RFPs (saved to database, emails sent if configured)
   - Use the `/demo` page to simulate vendor responses
   - Compare proposals with AI assistance

## 3. API Documentation

### RFPs

#### Create RFP from Natural Language
```
POST /api/rfps/create-from-natural-language
Content-Type: application/json

Request Body:
{
  "naturalLanguage": "I need to procure laptops and monitors for our new office. Budget is $50,000 total..."
}

Response:
{
  "rfp": {
    "id": 1,
    "title": "Office Equipment Procurement",
    "description": "...",
    "budget": 50000,
    "deadline": "2024-02-15",
    ...
  }
}
```

#### Get All RFPs
```
GET /api/rfps

Response:
{
  "rfps": [...]
}
```

#### Get Single RFP
```
GET /api/rfps/:id

Response:
{
  "rfp": {...},
  "proposals": [...],
  "scores": [...]
}
```

#### Send RFP to Vendors
```
POST /api/rfps/send
Content-Type: application/json

Request Body:
{
  "rfpId": 1,
  "vendorIds": [1, 2, 3]
}

Response:
{
  "results": [
    {
      "vendorId": 1,
      "vendorName": "Tech Solutions Inc.",
      "success": true,
      "messageId": "..."
    }
  ]
}
```

### Vendors

#### Get All Vendors
```
GET /api/vendors
```

#### Create Vendor
```
POST /api/vendors
Content-Type: application/json

Request Body:
{
  "name": "Tech Solutions Inc.",
  "email": "contact@techsolutions.com",
  "contact_person": "John Smith",
  "phone": "+1-555-0101",
  "address": "123 Tech Street..."
}
```

#### Update Vendor
```
PUT /api/vendors/:id
Content-Type: application/json

Request Body: (same as create)
```

#### Delete Vendor
```
DELETE /api/vendors/:id
```

### Proposals

#### Process Vendor Response
```
POST /api/proposals/process
Content-Type: application/json

Request Body:
{
  "emailBody": "Thank you for the RFP. We are pleased to submit...",
  "emailSubject": "Re: RFP: Office Equipment",
  "fromEmail": "contact@techsolutions.com",
  "messageId": "..."
}
```

#### Compare Proposals
```
GET /api/proposals/compare/:rfpId

Response:
{
  "comparison": {
    "summary": "...",
    "best_proposal_id": 1,
    "proposals": [
      {
        "id": 1,
        "overall_score": 85.5,
        "price_score": 90,
        "terms_score": 80,
        "completeness_score": 87,
        "recommendation_reason": "..."
      }
    ]
  },
  "proposals": [...]
}
```

#### Check for New Emails
```
POST /api/proposals/check-emails

Response:
{
  "processed": 2,
  "emails": [...]
}
```

## 4. Decisions & Assumptions

### Key Design Decisions

#### Database Schema

### Database Schema

**Key Tables:**
- `vendors` - Vendor master data
- `rfps` - RFP definitions with flexible JSONB `requirements` field
- `rfp_vendors` - Many-to-many relationship tracking RFP sends
- `proposals` - Vendor responses with AI-extracted structured data
- `proposal_scores` - AI-generated comparison scores

**Design Rationale:**
- Used PostgreSQL for ACID compliance and JSONB support for flexible requirements
- JSONB fields allow schema evolution without migrations
- Separate scores table enables historical tracking of comparisons

### API Design

- RESTful endpoints with clear resource naming
- Consistent error responses: `{ error: "message" }`
- JSON request/response format
- CORS enabled for frontend-backend communication

### Frontend Architecture

- Component-based React structure
- Centralized API client (`src/api/api.js`)
- Route-based navigation for different views
- Minimal state management (local component state)

### Email Processing Flow

1. **Sending:** User selects vendors → System generates email from RFP → Sends via SMTP → Records in `rfp_vendors`
2. **Receiving:** IMAP checks inbox → Parses email → Matches vendor by email → Finds associated RFP → AI extracts data → Saves to `proposals`

### Assumptions

1. **Email Matching:** Vendor email addresses are unique identifiers. Responses must come from the same email address as the vendor record.
2. **Single Active RFP:** Assumes one active RFP per vendor at a time. When processing responses, uses the most recent RFP-vendor relationship.
3. **Email Format:** Vendor responses are expected in email body text. Attachments are not currently parsed.
4. **Manual Email Check:** Email checking is manual (button-triggered) rather than automatic to avoid constant IMAP connections.
5. **Single User:** System is designed for single-user use (no authentication required as per assignment requirements).
6. **RFP Structure:** RFPs are created once and sent. No editing after sending (to maintain data integrity for comparisons).
7. **Optional Email:** Email sending/receiving is optional. The system works fully without email configuration - RFPs are saved to the database and can be managed through the web interface.

### API Design

- RESTful endpoints with clear resource naming
- Consistent error responses: `{ error: "message" }`
- JSON request/response format
- CORS enabled for frontend-backend communication

### Frontend Architecture

- Component-based React structure
- Centralized API client (`src/api/api.js`)
- Route-based navigation for different views
- Minimal state management (local component state)

### Email Processing Flow

1. **Sending:** User selects vendors → System generates email from RFP → Sends via SMTP → Records in `rfp_vendors`
2. **Receiving:** IMAP checks inbox → Parses email → Matches vendor by email → Finds associated RFP → AI extracts data → Saves to `proposals`

## 5. AI Tools Usage

### Tools Used
- **Cursor AI** - Primary development assistant for code generation and debugging
- **Claude (Anthropic)** - Code review and architecture decisions
- **ChatGPT** - Prompt engineering and AI integration design

### What AI Helped With

1. **Boilerplate Generation:**
   - React component structure and styling
   - Express route and controller patterns
   - Database schema design

2. **AI Integration Design:**
   - Prompt engineering for GPT-4 Turbo
   - JSON response format design
   - Error handling strategies for AI API calls

3. **Architecture Decisions:**
   - Database schema optimization (JSONB for flexible requirements)
   - API endpoint design and RESTful patterns
   - Email processing flow design

4. **Code Quality:**
   - Error handling patterns
   - Async/await best practices
   - Code organization and separation of concerns

### Notable Prompts/Approaches

1. **RFP Extraction Prompt:**
   - Used example-based prompting with clear JSON schema
   - Emphasized null handling for missing fields
   - Included edge case handling instructions
   - Temperature: 0.3 for consistency

2. **Response Parsing Prompt:**
   - Focused on robustness to handle various email formats (free-form text, tables)
   - Explicitly requested null for missing data
   - Structured output for easy database insertion
   - Temperature: 0.2 for accuracy

3. **Comparison Prompt:**
   - Provided full context (RFP + all proposals)
   - Requested multi-dimensional analysis (price, terms, completeness)
   - Asked for both scores and explanations
   - Temperature: 0.3 for balanced analysis

### What Changed Because of AI Tools

1. **Improved Error Handling:** AI suggested more comprehensive try-catch blocks and error messages
2. **Better Prompt Design:** Iterative refinement based on AI feedback improved extraction accuracy
3. **Code Organization:** AI helped identify separation of concerns (controllers, services, routes)
4. **Database Design:** AI suggested JSONB for flexible requirements storage, avoiding rigid schemas

## AI Integration Details

### 1. Natural Language to RFP Conversion

**Model:** GPT-4 Turbo with JSON mode

**Prompt Strategy:**
- System prompt defines role as procurement assistant
- User prompt includes example output format
- Temperature: 0.3 (lower for consistency)
- Response format: JSON object

**Extracted Fields:**
- Title, description, budget, dates
- Payment terms, warranty requirements
- Structured requirements array with items, quantities, specifications

### 2. Vendor Response Parsing

**Model:** GPT-4 Turbo with JSON mode

**Prompt Strategy:**
- Focuses on extracting structured pricing and terms
- Handles free-form text, tables, and various formats
- Temperature: 0.2 (very low for accuracy)
- Returns null for missing fields

**Extracted Data:**
- Total price, line items with quantities and prices
- Payment terms, warranty, delivery dates
- Additional notes and conditions

### 3. Proposal Comparison

**Model:** GPT-4 Turbo with JSON mode

**Prompt Strategy:**
- Provides full RFP context and all proposals
- Requests multi-dimensional scoring (price, terms, completeness)
- Generates recommendation with reasoning
- Temperature: 0.3 (balanced)

**Output:**
- Scores (0-100) for each dimension
- Overall recommendation
- Summary and key differences

**Scoring Logic:**
- Price score: Lower is better (within budget)
- Terms score: Alignment with RFP requirements
- Completeness: How well proposal meets all requirements
- Overall: Weighted combination

## Email Configuration (How to Configure Email Sending/Receiving)

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
2. **Generate App Password:**
   - Google Account → Security → 2-Step Verification → App passwords
   - Create password for "Mail"
3. **Use App Password in `.env`** (not your regular password)

### SMTP Configuration
- Host: `smtp.gmail.com`
- Port: `587` (TLS)
- Authentication: Email + App Password

### IMAP Configuration
- Host: `imap.gmail.com`
- Port: `993` (SSL)
- Authentication: Email + App Password

### Email Processing

- System checks for unread emails in INBOX
- Matches sender email to vendor records
- Uses most recent RFP-vendor relationship
- Marks emails as read after processing

## Known Limitations & Future Work

1. **Email Matching:** Requires exact email match between vendor record and sender
2. **Single RFP per Vendor:** Assumes one active RFP per vendor (uses most recent)
3. **No Attachment Parsing:** Currently only parses email body text
4. **Manual Email Check:** Requires manual trigger to check for new emails (no webhook)
5. **No Authentication:** Single-user system (as per requirements)
6. **IMAP Connection:** Requires persistent IMAP connection (not ideal for production)

### Future Enhancements

1. **Real-time Email Processing:**
   - Webhook integration (SendGrid, Mailgun)
   - Background job queue for email processing

2. **Attachment Support:**
   - PDF parsing for proposals
   - Image OCR for scanned documents

3. **Enhanced AI Features:**
   - Multi-turn conversation for RFP refinement
   - Automated follow-up email generation
   - Risk analysis and compliance checking

4. **Advanced Comparison:**
   - Customizable scoring weights
   - Historical trend analysis
   - Side-by-side visual comparison

5. **Workflow Improvements:**
   - RFP templates and cloning
   - Automated deadline reminders
   - Vendor response tracking dashboard

6. **Production Readiness:**
   - User authentication and authorization
   - Multi-tenant support
   - Audit logging
   - Rate limiting and API security

## License

MIT

## Author

Built as an SDE assignment demonstrating full-stack development with AI integration.

