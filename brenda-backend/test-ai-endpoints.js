/**
 * AI Features Test Script
 * Tests all 5 AI endpoints
 * 
 * Prerequisites:
 * 1. Backend server running (npm run dev)
 * 2. GEMINI_API_KEY set in .env
 * 3. Valid JWT token (update TOKEN variable below)
 */

const API_BASE_URL = 'http://localhost:5000/api';

// Read token from environment variable if provided, else fallback placeholder
const TOKEN = process.env.TEST_JWT || 'your_jwt_token_here';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${TOKEN}`
};

// Test 1: Enhance Job Description
async function testEnhanceJobDescription() {
  console.log('\n🧪 Test 1: Enhance Job Description');
  console.log('='.repeat(50));
  
  const payload = {
    title: 'React Developer',
    description: 'Need someone to build a website with React',
    category: 'Web Development',
    skills: ['React', 'JavaScript']
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/enhance-job-description`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nOriginal Description:');
      console.log(data.original.description);
      console.log('\nEnhanced Description:');
      console.log(data.enhanced.description);
      console.log('\nSuggested Skills:', data.enhanced.skills);
      console.log('Suggested Budget:', data.enhanced.budget);
    } else {
      console.log('❌ Failed:', data.message || data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 2: Enhance Proposal
async function testEnhanceProposal() {
  console.log('\n🧪 Test 2: Enhance Proposal');
  console.log('='.repeat(50));
  
  const payload = {
    proposal: 'I can build this website for you. I have experience with React.',
    jobTitle: 'React Developer',
    jobDescription: 'Build a modern e-commerce website with React'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/enhance-proposal`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nOriginal Proposal:');
      console.log(data.original.proposal);
      console.log('\nEnhanced Proposal:');
      console.log(data.enhanced.proposal);
    } else {
      console.log('❌ Failed:', data.message || data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 3: Generate Job Suggestions
async function testJobSuggestions() {
  console.log('\n🧪 Test 3: Generate Job Suggestions');
  console.log('='.repeat(50));
  
  const payload = {
    title: 'Full Stack Developer',
    category: 'Web Development'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/job-suggestions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nSuggested Skills:', data.suggestions.skills);
      console.log('\nSuggested Description:');
      console.log(data.suggestions.description);
      console.log('\nSuggested Budget:', data.suggestions.budget);
    } else {
      console.log('❌ Failed:', data.message || data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 4: Analyze Proposal
async function testAnalyzeProposal() {
  console.log('\n🧪 Test 4: Analyze Proposal');
  console.log('='.repeat(50));
  
  const payload = {
    proposal: 'I am a senior React developer with 5 years of experience. I have built several e-commerce websites using React, Redux, and Node.js. I can complete this project in 4 weeks.',
    jobTitle: 'React Developer',
    jobDescription: 'Build a modern e-commerce website with React and Node.js'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/analyze-proposal`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nScore:', data.analysis.score, '/100');
      console.log('\nStrengths:');
      data.analysis.strengths.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
      console.log('\nImprovements:');
      data.analysis.improvements.forEach((i, idx) => console.log(`  ${idx + 1}. ${i}`));
      console.log('\nOverall Feedback:');
      console.log(data.analysis.overallFeedback);
    } else {
      console.log('❌ Failed:', data.message || data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Test 5: Generate Cover Letter
async function testGenerateCoverLetter() {
  console.log('\n🧪 Test 5: Generate Cover Letter');
  console.log('='.repeat(50));
  
  const payload = {
    jobTitle: 'Senior Full Stack Developer',
    jobDescription: 'Build a MERN stack application with real-time features',
    jobRequirements: 'React, Node.js, MongoDB, Express, Socket.io',
    freelancerExperience: '8 years of full stack development experience'
  };

  try {
    const response = await fetch(`${API_BASE_URL}/ai/generate-cover-letter`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Success!');
      console.log('\nGenerated Cover Letter:');
      console.log(data.coverLetter);
    } else {
      console.log('❌ Failed:', data.message || data.error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting AI Features Test Suite');
  console.log('='.repeat(50));
  
  // Check if token is set
  if (TOKEN === 'your_jwt_token_here') {
    console.log('\n⚠️  WARNING: Please update the TOKEN variable with a valid JWT token');
    console.log('To get a token:');
    console.log('1. Start the frontend (npm run dev in brenda folder)');
    console.log('2. Login to the application');
    console.log('3. Open browser DevTools > Console');
    console.log('4. Type: localStorage.getItem("token")');
    console.log('5. Copy the token and paste it in this script\n');
  }

  console.log('Testing API at:', API_BASE_URL);
  console.log('Using authentication token:', TOKEN.substring(0, 20) + '...');
  
  await testEnhanceJobDescription();
  await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s between tests
  
  await testEnhanceProposal();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testJobSuggestions();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testAnalyzeProposal();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  await testGenerateCoverLetter();
  
  console.log('\n' + '='.repeat(50));
  console.log('✨ Test Suite Complete!');
  console.log('='.repeat(50));
}

// Run tests
runAllTests();
