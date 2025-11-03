/**
 * Quick Gemini AI Test
 * Tests the Gemini API directly without needing authentication
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function testGeminiAPI() {
  console.log('\n🧪 Testing Gemini AI Integration');
  console.log('='.repeat(60));

  // Check if API key is set
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ ERROR: GEMINI_API_KEY is not set in .env file');
    console.log('\nPlease add your Gemini API key to the .env file:');
    console.log('GEMINI_API_KEY=your_actual_key_here');
    return;
  }

  console.log('✅ API Key found:', apiKey.substring(0, 20) + '...');
  console.log('\n📡 Connecting to Gemini Pro...\n');

  try {
    // Initialize Gemini AI
    const genAI = new GoogleGenerativeAI(apiKey);
      // Use an available model per REST list
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Test 1: Simple text generation
    console.log('Test 1: Simple Text Generation');
    console.log('-'.repeat(60));
    const prompt1 = 'Say "Hello, AI features are working!" and nothing else.';
    
    const result1 = await model.generateContent(prompt1);
    const response1 = result1.response.text();
    
    console.log('Response:', response1);
    console.log('✅ Test 1 Passed!\n');

    // Test 2: Job Description Enhancement
    console.log('Test 2: Job Description Enhancement');
    console.log('-'.repeat(60));
    const jobPrompt = `Enhance this job description to be more professional and detailed:

Title: React Developer
Description: Need someone to build a website with React

Make it professional, clear, and compelling. Return only the enhanced description.`;

    const result2 = await model.generateContent(jobPrompt);
    const response2 = result2.response.text();
    
    console.log('Original: "Need someone to build a website with React"');
    console.log('\nEnhanced:');
    console.log(response2);
    console.log('\n✅ Test 2 Passed!\n');

    // Test 3: Proposal Analysis
    console.log('Test 3: Proposal Analysis');
    console.log('-'.repeat(60));
    const analysisPrompt = `Analyze this freelancer proposal and provide a score (0-100):

Proposal: "I can do this job. I have 5 years of experience with React and have built many websites."

Provide:
1. Score (0-100)
2. Two strengths
3. Two improvements

Format as JSON.`;

    const result3 = await model.generateContent(analysisPrompt);
    const response3 = result3.response.text();
    
    console.log('Analysis Result:');
    console.log(response3);
    console.log('\n✅ Test 3 Passed!\n');

    // Summary
    console.log('='.repeat(60));
    console.log('🎉 All Tests Passed Successfully!');
    console.log('='.repeat(60));
    console.log('\n✅ Gemini AI is working correctly!');
    console.log('✅ API key is valid');
    console.log('✅ All 5 AI features should work:');
    console.log('   1. Enhance Job Description');
    console.log('   2. Enhance Proposal');
    console.log('   3. Generate Job Suggestions');
    console.log('   4. Analyze Proposal');
    console.log('   5. Generate Cover Letter');
    console.log('\n🚀 You can now use AI features in your application!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Login to your application');
    console.log('3. Try the AI features in the job posting form');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('\n💡 The API key is invalid. Please check:');
      console.log('1. Visit: https://makersuite.google.com/app/apikey');
      console.log('2. Create a new API key');
      console.log('3. Update .env file with the new key');
    } else if (error.message.includes('quota')) {
      console.log('\n💡 API quota exceeded. Wait a moment and try again.');
    } else {
      console.log('\n💡 Error details:', error);
    }
  }
}

// Run the test
testGeminiAPI();
