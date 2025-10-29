const crypto = require('crypto');

/**
 * Generate secure random strings for JWT secrets
 * This script generates cryptographically secure random strings
 * suitable for JWT signing and other security purposes
 */

function generateSecureSecret(length = 64) {
  // Generate a cryptographically secure random string
  // Using hex encoding for better compatibility
  return crypto.randomBytes(length).toString('hex');
}

function generateBase64Secret(length = 48) {
  // Generate a base64 encoded secret (shorter but still secure)
  return crypto.randomBytes(length).toString('base64');
}

function generateUrlSafeSecret(length = 48) {
  // Generate a URL-safe base64 secret
  return crypto.randomBytes(length).toString('base64url');
}

console.log('🔐 Generating Secure JWT Secrets for Brenda Platform\n');

// Generate different types of secrets
const jwtSecret = generateSecureSecret(64);
const jwtRefreshSecret = generateSecureSecret(64);
const base64Secret = generateBase64Secret(48);
const urlSafeSecret = generateUrlSafeSecret(48);

console.log('📋 Generated Secrets:');
console.log('===================\n');

console.log('JWT_SECRET (64 bytes hex):');
console.log(`"${jwtSecret}"`);
console.log(`Length: ${jwtSecret.length} characters\n`);

console.log('JWT_REFRESH_SECRET (64 bytes hex):');
console.log(`"${jwtRefreshSecret}"`);
console.log(`Length: ${jwtRefreshSecret.length} characters\n`);

console.log('Alternative Base64 Secret (48 bytes):');
console.log(`"${base64Secret}"`);
console.log(`Length: ${base64Secret.length} characters\n`);

console.log('Alternative URL-Safe Secret (48 bytes):');
console.log(`"${urlSafeSecret}"`);
console.log(`Length: ${urlSafeSecret.length} characters\n`);

console.log('🔧 .env Configuration:');
console.log('=====================');
console.log('Add these to your .env file:\n');
console.log(`JWT_SECRET="${jwtSecret}"`);
console.log(`JWT_REFRESH_SECRET="${jwtRefreshSecret}"`);
console.log(`JWT_EXPIRE="7d"`);
console.log(`JWT_REFRESH_EXPIRE="30d"`);

console.log('\n✅ Secrets generated successfully!');
console.log('💡 Copy the JWT secrets above to your .env file');
console.log('🔒 Keep these secrets secure and never commit them to version control');

// Security recommendations
console.log('\n🛡️  Security Recommendations:');
console.log('=============================');
console.log('• Use different secrets for JWT and JWT_REFRESH');
console.log('• Keep secrets at least 32 characters long');
console.log('• Use cryptographically secure random generation');
console.log('• Never share secrets in plain text');
console.log('• Rotate secrets periodically in production');
console.log('• Use environment variables, not hardcoded values');


