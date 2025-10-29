const API_BASE = 'http://localhost:5000/api';

async function testPublicPortfolioEndpoints() {
  console.log('🧪 Testing Public Portfolio Endpoints\n');

  try {
    // Test 1: Get categories (existing public endpoint)
    console.log('Test 1: GET /portfolio/categories');
    const categoriesRes = await fetch(`${API_BASE}/portfolio/categories`);
    const categoriesData = await categoriesRes.json();
    console.log('✅ Status:', categoriesRes.status);
    console.log('📦 Response:', categoriesData);
    console.log('');

    // Test 2: Get public portfolio for a user
    // Note: You'll need to replace 'USER_ID_HERE' with an actual user ID from your database
    const testUserId = 'cm0w8nfqr0003t5fvnw7z5s5e'; // Replace with actual user ID
    console.log(`Test 2: GET /portfolio/public/user/${testUserId}`);
    const publicPortfolioRes = await fetch(`${API_BASE}/portfolio/public/user/${testUserId}`);
    const publicPortfolioData = await publicPortfolioRes.json();
    console.log('✅ Status:', publicPortfolioRes.status);
    console.log('📦 Response:', JSON.stringify(publicPortfolioData, null, 2));
    console.log('');

    // Test 3: Get public portfolio with filters
    console.log(`Test 3: GET /portfolio/public/user/${testUserId}?featured=true`);
    const featuredRes = await fetch(`${API_BASE}/portfolio/public/user/${testUserId}?featured=true`);
    const featuredData = await featuredRes.json();
    console.log('✅ Status:', featuredRes.status);
    console.log('📦 Response:', JSON.stringify(featuredData, null, 2));
    console.log('');

    // Test 4: Get a single public portfolio item
    if (publicPortfolioData.data && publicPortfolioData.data.length > 0) {
      const itemId = publicPortfolioData.data[0].id;
      console.log(`Test 4: GET /portfolio/public/item/${itemId}`);
      const itemRes = await fetch(`${API_BASE}/portfolio/public/item/${itemId}`);
      const itemData = await itemRes.json();
      console.log('✅ Status:', itemRes.status);
      console.log('📦 Response:', JSON.stringify(itemData, null, 2));
      console.log('');
    } else {
      console.log('⚠️  Test 4: Skipped (no portfolio items found)');
      console.log('');
    }

    // Test 5: Try to get private portfolio items (should not be visible)
    console.log('Test 5: Verify private items are hidden');
    console.log('💡 Create a private portfolio item and verify it doesn\'t appear in public endpoints');
    console.log('');

    console.log('✅ All tests completed!\n');
    console.log('📝 Note: To fully test:');
    console.log('   1. Update testUserId with an actual user ID from your database');
    console.log('   2. Create some portfolio items (both public and private)');
    console.log('   3. Run: node test-public-portfolio.js');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testPublicPortfolioEndpoints();
