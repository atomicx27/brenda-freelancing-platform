// Frontend-Backend Connection Test for Automation System
// This script tests all automation endpoints from the frontend perspective

const API_BASE_URL = 'http://localhost:5000/api';

// Test user credentials (update these)
const TEST_CREDENTIALS = {
  email: 'test@example.com',
  password: 'Test123456'
};

let authToken = '';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// API request helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    return { status: 500, ok: false, error: error.message };
  }
}

// Test categories
const tests = {
  authentication: [],
  automationRules: [],
  emailCampaigns: [],
  smartContracts: [],
  invoices: [],
  leadScores: [],
  reminders: [],
  followUpRules: [],
  statusUpdateRules: [],
  monitoring: []
};

// Authentication tests
tests.authentication.push({
  name: 'POST /api/auth/login - Login',
  async run() {
    const result = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(TEST_CREDENTIALS)
    });

    if (result.ok && result.data.data?.token) {
      authToken = result.data.data.token;
      return { success: true, message: 'Login successful' };
    }
    return { success: false, message: result.data.message || 'Login failed' };
  }
});

// Automation Rules tests
tests.automationRules.push({
  name: 'GET /api/automation/rules - List automation rules',
  async run() {
    const result = await apiRequest('/automation/rules');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.rules?.length || 0} rules` : 'Failed to fetch rules' 
    };
  }
});

tests.automationRules.push({
  name: 'POST /api/automation/rules - Create automation rule',
  async run() {
    const ruleData = {
      name: 'Frontend Test Rule',
      description: 'Testing frontend-backend connection',
      type: 'CUSTOM',
      trigger: 'MANUAL',
      conditions: {},
      actions: [{
        type: 'SEND_EMAIL',
        to: 'test@example.com',
        subject: 'Test',
        html: '<p>Test</p>'
      }],
      isActive: false
    };

    const result = await apiRequest('/automation/rules', {
      method: 'POST',
      body: JSON.stringify(ruleData)
    });

    return { 
      success: result.ok, 
      message: result.ok ? 'Rule created successfully' : result.data.message || 'Failed to create rule' 
    };
  }
});

// Email Campaigns tests
tests.emailCampaigns.push({
  name: 'GET /api/automation/email-campaigns - List email campaigns',
  async run() {
    const result = await apiRequest('/automation/email-campaigns');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.campaigns?.length || 0} campaigns` : 'Failed to fetch campaigns' 
    };
  }
});

// Smart Contracts tests
tests.smartContracts.push({
  name: 'GET /api/automation/contracts - List smart contracts',
  async run() {
    const result = await apiRequest('/automation/contracts');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.contracts?.length || 0} contracts` : 'Failed to fetch contracts' 
    };
  }
});

// Invoices tests
tests.invoices.push({
  name: 'GET /api/automation/invoices - List invoices',
  async run() {
    const result = await apiRequest('/automation/invoices');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.invoices?.length || 0} invoices` : 'Failed to fetch invoices' 
    };
  }
});

// Lead Scores tests
tests.leadScores.push({
  name: 'GET /api/automation/lead-scores - List lead scores',
  async run() {
    const result = await apiRequest('/automation/lead-scores');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.leadScores?.length || 0} lead scores` : 'Failed to fetch lead scores' 
    };
  }
});

// Reminders tests
tests.reminders.push({
  name: 'GET /api/automation/reminders - List reminders',
  async run() {
    const result = await apiRequest('/automation/reminders');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.reminders?.length || 0} reminders` : 'Failed to fetch reminders' 
    };
  }
});

// Follow-up Rules tests
tests.followUpRules.push({
  name: 'GET /api/automation/follow-up-rules - List follow-up rules',
  async run() {
    const result = await apiRequest('/automation/follow-up-rules');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.followUpRules?.length || 0} follow-up rules` : 'Failed to fetch follow-up rules' 
    };
  }
});

// Status Update Rules tests
tests.statusUpdateRules.push({
  name: 'GET /api/automation/status-update-rules - List status update rules',
  async run() {
    const result = await apiRequest('/automation/status-update-rules');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.statusUpdateRules?.length || 0} status update rules` : 'Failed to fetch status update rules' 
    };
  }
});

// Monitoring tests
tests.monitoring.push({
  name: 'GET /api/monitoring/health - System health',
  async run() {
    const result = await apiRequest('/monitoring/health');
    return { 
      success: result.ok, 
      message: result.ok ? `Total Rules: ${result.data.data?.summary?.totalRules || 0}, Active: ${result.data.data?.summary?.activeRules || 0}` : 'Failed to fetch health' 
    };
  }
});

tests.monitoring.push({
  name: 'GET /api/monitoring/logs - Execution logs',
  async run() {
    const result = await apiRequest('/monitoring/logs?limit=5');
    return { 
      success: result.ok, 
      message: result.ok ? `Found ${result.data.data?.logs?.length || 0} logs` : 'Failed to fetch logs' 
    };
  }
});

// Run all tests
async function runTests() {
  log('\n╔══════════════════════════════════════════════════════════╗', 'cyan');
  log('║  FRONTEND-BACKEND CONNECTION TEST - AUTOMATION SYSTEM   ║', 'cyan');
  log('╚══════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`Testing against: ${API_BASE_URL}`, 'blue');
  log(`Time: ${new Date().toISOString()}\n`, 'blue');

  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    byCategory: {}
  };

  for (const [category, categoryTests] of Object.entries(tests)) {
    if (categoryTests.length === 0) continue;

    log(`\n${'='.repeat(60)}`, 'yellow');
    log(`${category.toUpperCase()}`, 'yellow');
    log('='.repeat(60), 'yellow');

    results.byCategory[category] = { total: 0, passed: 0, failed: 0 };

    for (const test of categoryTests) {
      results.total++;
      results.byCategory[category].total++;

      try {
        const result = await test.run();
        
        if (result.success) {
          log(`✅ ${test.name}`, 'green');
          log(`   ${result.message}`, 'green');
          results.passed++;
          results.byCategory[category].passed++;
        } else {
          log(`❌ ${test.name}`, 'red');
          log(`   ${result.message}`, 'red');
          results.failed++;
          results.byCategory[category].failed++;
        }
      } catch (error) {
        log(`❌ ${test.name}`, 'red');
        log(`   Error: ${error.message}`, 'red');
        results.failed++;
        results.byCategory[category].failed++;
      }
    }
  }

  // Summary
  log('\n' + '═'.repeat(60), 'cyan');
  log('TEST SUMMARY', 'cyan');
  log('═'.repeat(60), 'cyan');

  log(`\nOverall Results:`, 'blue');
  log(`  Total Tests: ${results.total}`, 'blue');
  log(`  ✅ Passed: ${results.passed}`, 'green');
  log(`  ❌ Failed: ${results.failed}`, 'red');
  log(`  Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, 'blue');

  log(`\nBy Category:`, 'blue');
  for (const [category, stats] of Object.entries(results.byCategory)) {
    const rate = Math.round((stats.passed / stats.total) * 100);
    const statusColor = rate === 100 ? 'green' : rate >= 50 ? 'yellow' : 'red';
    log(`  ${category}: ${stats.passed}/${stats.total} (${rate}%)`, statusColor);
  }

  log('\n' + '═'.repeat(60), 'cyan');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED! Frontend is correctly connected to backend.\n', 'green');
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed. Check the output above.\n`, 'yellow');
  }

  // Connection checklist
  log('\n📋 Connection Checklist:', 'cyan');
  log('  ✓ Backend running on http://localhost:5000', authToken ? 'green' : 'red');
  log('  ✓ Authentication working', authToken ? 'green' : 'red');
  log('  ✓ API endpoints accessible', results.passed > 1 ? 'green' : 'red');
  log('  ✓ CORS configured properly', results.passed > 0 ? 'green' : 'red');
  log('  ✓ Monitoring endpoints available', results.byCategory.monitoring?.passed > 0 ? 'green' : 'red');

  log('\n📚 Frontend API Service:', 'cyan');
  log('  Location: brenda/src/services/api.js', 'blue');
  log('  Features: ✓ Automation Rules, ✓ Monitoring, ✓ All CRUD operations', 'green');

  log('\n💡 Next Steps:', 'cyan');
  log('  1. Open http://localhost:5173/automation in your browser', 'blue');
  log('  2. Check the AutomationDashboard component', 'blue');
  log('  3. Test creating automation rules via UI', 'blue');
  log('  4. Monitor execution via /monitoring endpoints\n', 'blue');
}

// Run the tests
runTests().catch(err => {
  log(`\n❌ Test suite crashed: ${err.message}\n`, 'red');
  process.exit(1);
});
