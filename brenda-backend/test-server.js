// Simple test script to verify the server starts
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Testing Brenda Backend Server...\n');

// Set environment variables for testing
process.env.NODE_ENV = 'development';
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRE = '7d';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.JWT_REFRESH_EXPIRE = '30d';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

// Start the server
const server = spawn('node', ['dist/index.js'], {
  cwd: path.join(__dirname),
  stdio: 'pipe'
});

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
  console.log(data.toString());
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
  console.error(data.toString());
});

server.on('close', (code) => {
  console.log(`\n✅ Server test completed with exit code: ${code}`);
  if (code === 0) {
    console.log('🎉 Backend server is working correctly!');
  } else {
    console.log('❌ Server encountered an error');
    console.log('Error output:', errorOutput);
  }
});

// Kill the server after 5 seconds
setTimeout(() => {
  server.kill();
  console.log('\n⏰ Test completed - server stopped');
}, 5000);



