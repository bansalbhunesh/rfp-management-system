/**
 * Environment variable validation
 * Checks required environment variables at startup
 */

function validateEnvironment() {
  const errors = [];
  const warnings = [];

  // Database is optional - will use SQLite if not configured
  if (!process.env.DB_NAME || !process.env.DB_USER) {
    warnings.push('DB_NAME and DB_USER not set - using SQLite database');
  }

  // Optional but recommended
  if (!process.env.OPENAI_API_KEY) {
    warnings.push('OPENAI_API_KEY not set - will use local parsing fallback');
  }

  // Email configuration warnings
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    warnings.push('Email configuration incomplete - email sending may not work');
  }

  if (!process.env.IMAP_HOST || !process.env.IMAP_USER) {
    warnings.push('IMAP configuration incomplete - email receiving may not work');
  }

  // Display warnings
  if (warnings.length > 0) {
    console.log('\n⚠️  Environment Warnings:');
    warnings.forEach(w => console.log(`   - ${w}`));
  }

  // Display errors and exit if critical
  if (errors.length > 0) {
    console.error('\n❌ Environment Errors:');
    errors.forEach(e => console.error(`   - ${e}`));
    console.error('\n💡 Please check your .env file and ensure all required variables are set.');
    return false;
  }

  // Don't block startup for warnings - SQLite fallback will handle it
  return true;
}

module.exports = { validateEnvironment };

