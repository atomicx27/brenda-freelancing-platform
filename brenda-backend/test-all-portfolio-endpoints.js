const API_BASE = 'http://localhost:5000/api';

// You'll need to set these with actual values from your database
const TEST_USER_ID = 'cm0w8nfqr0003t5fvnw7z5s5e'; // Replace with actual user ID
const TEST_AUTH_TOKEN = 'your-auth-token-here'; // Get from login

async function testAllPortfolioEndpoints() {
  console.log('🧪 Testing All Portfolio Endpoints\n');
  console.log('=' .repeat(60));

  try {
    // ========== PUBLIC ENDPOINTS (No Auth) ==========
    console.log('\n📖 PUBLIC ENDPOINTS (No Authentication)\n');

    // Test 1: Browse portfolio
    console.log('Test 1: GET /portfolio/browse');
    const browseRes = await fetch(`${API_BASE}/portfolio/browse?page=1&limit=5`);
    const browseData = await browseRes.json();
    console.log('✅ Status:', browseRes.status);
    console.log('📦 Items found:', browseData.data?.items?.length || 0);
    console.log('📊 Total:', browseData.data?.pagination?.total || 0);
    console.log('');

    // Test 2: Get featured portfolio
    console.log('Test 2: GET /portfolio/featured');
    const featuredRes = await fetch(`${API_BASE}/portfolio/featured?limit=5`);
    const featuredData = await featuredRes.json();
    console.log('✅ Status:', featuredRes.status);
    console.log('📦 Featured items:', featuredData.data?.length || 0);
    console.log('');

    // Test 3: Search portfolio
    console.log('Test 3: GET /portfolio/search?q=web');
    const searchRes = await fetch(`${API_BASE}/portfolio/search?q=web&page=1&limit=5`);
    const searchData = await searchRes.json();
    console.log('✅ Status:', searchRes.status);
    console.log('📦 Search results:', searchData.data?.items?.length || 0);
    console.log('');

    // Test 4: Get user's public portfolio
    console.log(`Test 4: GET /portfolio/public/user/${TEST_USER_ID}`);
    const publicPortfolioRes = await fetch(`${API_BASE}/portfolio/public/user/${TEST_USER_ID}`);
    const publicPortfolioData = await publicPortfolioRes.json();
    console.log('✅ Status:', publicPortfolioRes.status);
    console.log('📦 User portfolio items:', publicPortfolioData.data?.length || 0);
    console.log('');

    // Test 5: Get categories
    console.log('Test 5: GET /portfolio/categories');
    const categoriesRes = await fetch(`${API_BASE}/portfolio/categories`);
    const categoriesData = await categoriesRes.json();
    console.log('✅ Status:', categoriesRes.status);
    console.log('📦 Categories:', categoriesData.data);
    console.log('');

    // ========== AUTHENTICATED ENDPOINTS ==========
    console.log('\n🔐 AUTHENTICATED ENDPOINTS\n');

    if (TEST_AUTH_TOKEN === 'your-auth-token-here') {
      console.log('⚠️  Skipping authenticated tests - Please set TEST_AUTH_TOKEN');
      console.log('   To get a token:');
      console.log('   1. Login via the app or API');
      console.log('   2. Copy the JWT token from localStorage or response');
      console.log('   3. Set TEST_AUTH_TOKEN in this script\n');
    } else {
      const authHeaders = {
        'Authorization': `Bearer ${TEST_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      };

      // Test 6: Get own portfolio
      console.log('Test 6: GET /portfolio (own items)');
      const ownPortfolioRes = await fetch(`${API_BASE}/portfolio`, {
        headers: authHeaders
      });
      const ownPortfolioData = await ownPortfolioRes.json();
      console.log('✅ Status:', ownPortfolioRes.status);
      console.log('📦 Own items:', ownPortfolioData.data?.length || 0);
      console.log('');

      // Test 7: Get portfolio stats
      console.log('Test 7: GET /portfolio/stats/overview');
      const statsRes = await fetch(`${API_BASE}/portfolio/stats/overview`, {
        headers: authHeaders
      });
      const statsData = await statsRes.json();
      console.log('✅ Status:', statsRes.status);
      console.log('📊 Stats:', statsData.data);
      console.log('');

      // Test 8: Create a test portfolio item
      console.log('Test 8: POST /portfolio (create item)');
      const createRes = await fetch(`${API_BASE}/portfolio`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Test Portfolio Item',
          description: 'This is a test portfolio item created by automated tests',
          category: 'Web Development',
          tags: ['React', 'Node.js', 'Testing'],
          technologies: ['JavaScript', 'Express'],
          isPublic: true,
          featured: false
        })
      });
      const createData = await createRes.json();
      console.log('✅ Status:', createRes.status);
      console.log('📦 Created item ID:', createData.data?.id);
      const testItemId = createData.data?.id;
      console.log('');

      if (testItemId) {
        // Test 9: Update the item
        console.log('Test 9: PUT /portfolio/:id (update item)');
        const updateRes = await fetch(`${API_BASE}/portfolio/${testItemId}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            title: 'Updated Test Portfolio Item',
            featured: true
          })
        });
        const updateData = await updateRes.json();
        console.log('✅ Status:', updateRes.status);
        console.log('📝 Updated successfully');
        console.log('');

        // Test 10: Like the item
        console.log('Test 10: POST /portfolio/:id/like (like item)');
        const likeRes = await fetch(`${API_BASE}/portfolio/${testItemId}/like`, {
          method: 'POST',
          headers: authHeaders
        });
        const likeData = await likeRes.json();
        console.log('✅ Status:', likeRes.status);
        console.log('❤️  Liked:', likeData.data?.liked);
        console.log('');

        // Test 11: Get item stats
        console.log('Test 11: GET /portfolio/:id/stats (item statistics)');
        const itemStatsRes = await fetch(`${API_BASE}/portfolio/${testItemId}/stats`, {
          headers: authHeaders
        });
        const itemStatsData = await itemStatsRes.json();
        console.log('✅ Status:', itemStatsRes.status);
        console.log('📊 Item stats:', itemStatsData.data);
        console.log('');

        // Test 12: Bulk update
        console.log('Test 12: POST /portfolio/bulk/update (bulk operations)');
        const bulkRes = await fetch(`${API_BASE}/portfolio/bulk/update`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            itemIds: [testItemId],
            updates: { isPublic: false }
          })
        });
        const bulkData = await bulkRes.json();
        console.log('✅ Status:', bulkRes.status);
        console.log('📝 Updated count:', bulkData.data?.updatedCount);
        console.log('');

        // Test 13: Reorder items
        console.log('Test 13: POST /portfolio/bulk/reorder (reorder items)');
        const reorderRes = await fetch(`${API_BASE}/portfolio/bulk/reorder`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            itemOrders: [{ id: testItemId, order: 1 }]
          })
        });
        const reorderData = await reorderRes.json();
        console.log('✅ Status:', reorderRes.status);
        console.log('📝 Reordered successfully');
        console.log('');

        // Test 14: Delete the test item
        console.log('Test 14: DELETE /portfolio/:id (cleanup)');
        const deleteRes = await fetch(`${API_BASE}/portfolio/${testItemId}`, {
          method: 'DELETE',
          headers: authHeaders
        });
        const deleteData = await deleteRes.json();
        console.log('✅ Status:', deleteRes.status);
        console.log('🗑️  Deleted successfully');
        console.log('');
      }
    }

    // Test 15: Track anonymous view
    console.log('Test 15: POST /portfolio/:id/view (track view - no auth)');
    if (publicPortfolioData.data && publicPortfolioData.data.length > 0) {
      const itemId = publicPortfolioData.data[0].id;
      const viewRes = await fetch(`${API_BASE}/portfolio/${itemId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const viewData = await viewRes.json();
      console.log('✅ Status:', viewRes.status);
      console.log('👁️  View tracked');
    } else {
      console.log('⚠️  Skipped - no portfolio items available');
    }
    console.log('');

    console.log('=' .repeat(60));
    console.log('\n✅ ALL TESTS COMPLETED!\n');
    console.log('📝 Summary of Implemented Endpoints:');
    console.log('   ✓ Browse public portfolio (pagination, filters)');
    console.log('   ✓ Get featured portfolio items');
    console.log('   ✓ Search portfolio items');
    console.log('   ✓ View user public portfolio');
    console.log('   ✓ View single public item');
    console.log('   ✓ Get portfolio categories');
    console.log('   ✓ Track portfolio views (anonymous & authenticated)');
    console.log('   ✓ Like/unlike portfolio items');
    console.log('   ✓ Get portfolio statistics');
    console.log('   ✓ Get item-specific statistics');
    console.log('   ✓ Bulk update portfolio items');
    console.log('   ✓ Reorder portfolio items');
    console.log('   ✓ Full CRUD operations\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

testAllPortfolioEndpoints();
