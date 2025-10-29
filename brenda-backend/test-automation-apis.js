// Test script for Automation API endpoints
// Run this with: node test-automation-apis.js

const API_BASE_URL = 'http://localhost:5000/api';

// Test data for authentication
const testCredentials = {
  email: 'test@example.com',
  password: 'password123'
};

async function testAutomationAPIs() {
  console.log('🧪 Testing Automation API Endpoints\n');

  try {
    // Step 1: Login to get authentication token
    console.log('1. Testing Authentication...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testCredentials)
    });

    if (!loginResponse.ok) {
      console.log('❌ Login failed. Please make sure you have a test user account.');
      console.log('   You can create one by registering in the frontend first.');
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.data.token;
    console.log('✅ Authentication successful');

    // Step 2: Test all automation endpoints
    const endpoints = [
      { name: 'Automation Rules', url: '/automation/rules' },
      { name: 'Smart Contracts', url: '/automation/contracts' },
      { name: 'Invoices', url: '/automation/invoices' },
      { name: 'Email Campaigns', url: '/automation/email-campaigns' },
      { name: 'Lead Scores', url: '/automation/lead-scores' },
      { name: 'Follow-up Rules', url: '/automation/follow-up-rules' },
      { name: 'Reminders', url: '/automation/reminders' },
      { name: 'Status Update Rules', url: '/automation/status-update-rules' }
    ];

    console.log('\n2. Testing Automation Endpoints...');
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint.url}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`✅ ${endpoint.name}: ${response.status} - ${data.data ? Object.keys(data.data).length : 0} items`);
        } else {
          console.log(`❌ ${endpoint.name}: ${response.status} - ${response.statusText}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name}: Error - ${error.message}`);
      }
    }

    console.log('\n3. Testing Response Structure...');
    
    // Test one endpoint in detail
    const testResponse = await fetch(`${API_BASE_URL}/automation/rules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });

    if (testResponse.ok) {
      const testData = await testResponse.json();
      console.log('✅ Response structure check:');
      console.log('   - Has status:', !!testData.status);
      console.log('   - Has data:', !!testData.data);
      console.log('   - Has rules array:', Array.isArray(testData.data?.rules));
      console.log('   - Rules count:', testData.data?.rules?.length || 0);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the tests
testAutomationAPIs();


