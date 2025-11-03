// Simple script to login and print JWT token
// Usage: node login-get-token.js [email] [password]

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5000/api';
const email = process.argv[2] || 'admin@brenda.com';
const password = process.argv[3] || 'admin123';

(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      console.error('Login failed:', data);
      process.exit(1);
    }
    const token = data?.token || data?.data?.token;
    if (!token) {
      console.error('Token not found in response:', data);
      process.exit(1);
    }
    console.log(token);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
