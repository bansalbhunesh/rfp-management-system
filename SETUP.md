# Quick Setup Guide

## Prerequisites
- Node.js v18 or higher
- PostgreSQL v12 or higher
- OpenAI API Key (from https://platform.openai.com/)
- Email account with SMTP/IMAP access (Gmail recommended)

## Step 1: Install Dependencies

From the root directory:
```bash
npm install
cd backend && npm install
cd ../frontend && npm install
```

Or use the convenience script:
```bash
npm run install-all
```

## Step 2: Set Up PostgreSQL Database

1. Create the database:
```bash
createdb rfp_management
```

Or using psql:
```sql
CREATE DATABASE rfp_management;
```

2. Run the schema:
```bash
psql -d rfp_management -f backend/database/schema.sql
```

Or using psql:
```bash
psql -d rfp_management < backend/database/schema.sql
```

## Step 3: Configure Environment Variables

Create `backend/.env` file with the following:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=rfp_management
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# OpenAI API Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here

# Email Configuration (SMTP for sending)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=your_email@gmail.com

# Email Configuration (IMAP for receiving)
IMAP_HOST=imap.gmail.com
IMAP_PORT=993
IMAP_USER=your_email@gmail.com
IMAP_PASSWORD=your_app_password

# Application Email
APP_EMAIL=your_email@gmail.com
```

**For Gmail users:**
1. Enable 2-Factor Authentication
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the App Password (not your regular password) in the `.env` file

## Step 4: Seed Initial Data (Optional)

```bash
cd backend
npm run seed
```

## Step 5: Run the Application

**Option 1: Run both frontend and backend together**
```bash
npm run dev
```

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

## Step 6: Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/health

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l | grep rfp_management`

### Email Issues
- For Gmail, use App Password (not regular password)
- Ensure 2-Factor Authentication is enabled
- Check SMTP/IMAP settings match your email provider

### OpenAI API Issues
- Verify API key is correct
- Check API key has sufficient credits
- Ensure API key has access to GPT-4 Turbo

### Port Already in Use
- Backend default port: 3001
- Frontend default port: 3000
- Change ports in `.env` (backend) or set `PORT` environment variable (frontend)


