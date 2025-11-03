/**
 * Detailed Gemini API Key Test
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testAPIKey() {
  console.log('\n🔍 Detailed API Key Test');
  console.log('='.repeat(60));

  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('API Key from .env:', apiKey);
  console.log('API Key length:', apiKey ? apiKey.length : 0);
  console.log('API Key trimmed:', apiKey ? apiKey.trim() : '');
  console.log('API Key starts with AIza:', apiKey ? apiKey.trim().startsWith('AIza') : false);
  
  console.log('\n📡 Testing API connection...\n');

  try {
    const genAI = new GoogleGenerativeAI(apiKey.trim());
  // Use an available model from your key's list (REST confirmed): gemini-2.5-flash
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('Sending test request to Gemini API...');
    const result = await model.generateContent('Hello, are you working?');
    const response = result.response.text();
    
    console.log('\n✅ SUCCESS!');
    console.log('Response:', response);
    console.log('\n🎉 Your Gemini API is working correctly!');
    
  } catch (error) {
    console.log('\n❌ ERROR Details:');
    console.log('Error Type:', error.constructor.name);
    console.log('Error Message:', error.message);
    console.log('Status:', error.status);
    console.log('Status Text:', error.statusText);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 Solution: Your API key appears to be invalid.');
      console.log('Please:');
      console.log('1. Go to https://makersuite.google.com/app/apikey');
      console.log('2. Create a new API key');
      console.log('3. Copy it exactly (including the AIza prefix)');
      console.log('4. Update the .env file');
    } else if (error.message.includes('404')) {
      console.log('\n💡 Solution: Model not found.');
      console.log('This might mean:');
      console.log('1. The API key doesn\'t have access to Gemini Pro');
      console.log('2. The service is not available in your region');
      console.log('3. You need to enable the Generative Language API');
      console.log('\nSteps to enable:');
      console.log('1. Visit https://makersuite.google.com/');
      console.log('2. Make sure you\'re signed in');
      console.log('3. Try creating a prompt there first');
      console.log('4. This will activate the API');
    } else {
      console.log('\n💡 Full error:', error);
    }
  }
}

testAPIKey();
