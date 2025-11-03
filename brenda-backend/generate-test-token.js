/**
 * Generate a test JWT token directly without login
 */
const dotenv = require('dotenv');
dotenv.config();

const jwt = require('jsonwebtoken');

const payload = {
  userId: 1,
  email: 'admin@brenda.com',
  userType: 'ADMIN'
};

const secret = process.env.JWT_SECRET;
const expiresIn = process.env.JWT_EXPIRE || '7d';

if (!secret) {
  console.error('JWT_SECRET not found in .env');
  process.exit(1);
}

const token = jwt.sign(payload, secret, { expiresIn });
console.log(token);
