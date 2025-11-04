const axios = require('axios');

async function testAdminEndpoint() {
  try {
    // First, login as admin to get token
    console.log('Logging in as admin...');
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@brenda.com',
      password: 'admin123'
    });

    const token = loginResponse.data.data.token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 20) + '...\n');

    // Test the update user status endpoint
    const userId = 'cmhgqfpcv0000ukj0pniymbmb'; // The user from your error
    
    console.log(`Testing PATCH /api/admin/users/${userId}/status`);
    
    try {
      const updateResponse = await axios.patch(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        {
          action: 'verify',
          reason: 'Test verification'
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('✅ Update successful');
      console.log('Response:', updateResponse.data);
    } catch (error) {
      if (error.response) {
        console.log('❌ Update failed');
        console.log('Status:', error.response.status);
        console.log('Error:', error.response.data);
      } else {
        console.log('❌ Request failed:', error.message);
      }
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ Login failed');
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else {
      console.error('❌ Request failed:', error.message);
    }
  }
}

testAdminEndpoint();
