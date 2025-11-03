/**
 * List Available Gemini Models
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

async function listModels() {
  console.log('\n📋 Listing Available Gemini Models');
  console.log('='.repeat(60));

  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('❌ ERROR: GEMINI_API_KEY is not set');
    return;
  }

  console.log('✅ API Key found\n');

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Try different model names that might work
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'models/gemini-pro',
      'models/gemini-1.5-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-latest'
    ];

    console.log('Testing available models...\n');
    
    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Say "test" and nothing else.');
        const response = result.response.text();
        
        console.log(`✅ ${modelName}: WORKS!`);
        console.log(`   Response: ${response}\n`);
        
        // If we found a working model, save it
        if (response) {
          console.log('='.repeat(60));
          console.log(`🎉 SUCCESS! Use this model name: "${modelName}"`);
          console.log('='.repeat(60));
          return;
        }
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message.split(':')[0]}`);
      }
    }
    
    console.log('\n⚠️  None of the common model names worked.');
    console.log('\n💡 Please check:');
    console.log('1. Your API key is valid');
    console.log('2. Visit: https://ai.google.dev/gemini-api/docs/models');
    console.log('3. Check which models are available for your API key');
    
  } catch (error) {
    console.log('\n❌ ERROR:', error.message);
  }
}

listModels();
