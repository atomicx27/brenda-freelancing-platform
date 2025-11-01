// Comprehensive Automation System Test Suite
// Run with: node test-automation-complete.js

const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials (update these to match your setup)
const TEST_USER = {
  email: 'test@example.com',
  password: 'Test123456'
};

let authToken = '';
let testRuleId = '';
let testCampaignId = '';
let testUserId = '';

// Utility function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`❌ API call failed: ${endpoint}`, error.message);
    return { status: 500, data: { error: error.message } };
  }
}

// Test suite sections
async function testAuthentication() {
  console.log('\n📝 Testing Authentication...');
  
  const result = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify(TEST_USER)
  });

  if (result.status === 200 && result.data.data?.token) {
    authToken = result.data.data.token;
    testUserId = result.data.data.user.id;
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${testUserId}`);
    return true;
  } else {
    console.log('❌ Authentication failed:', result.data);
    return false;
  }
}

async function testScheduledRule() {
  console.log('\n🕐 Testing Scheduled Rule Creation...');
  
  const ruleData = {
    name: 'Test Scheduled Email',
    description: 'Send a test email every hour',
    type: 'EMAIL_MARKETING',
    trigger: 'SCHEDULED',
    conditions: {
      intervalMinutes: 60
    },
    actions: [
      {
        type: 'SEND_EMAIL',
        to: TEST_USER.email,
        subject: 'Scheduled Test Email',
        html: '<h1>This is a scheduled automation test</h1><p>Sent at: {{event.timestamp}}</p>'
      }
    ],
    priority: 5
  };

  const result = await apiCall('/automation/rules', {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });

  if (result.status === 201 && result.data.data?.rule) {
    testRuleId = result.data.data.rule.id;
    console.log('✅ Scheduled rule created');
    console.log(`   Rule ID: ${testRuleId}`);
    return true;
  } else {
    console.log('❌ Scheduled rule creation failed:', result.data);
    return false;
  }
}

async function testEventBasedRule() {
  console.log('\n⚡ Testing Event-Based Rule Creation...');
  
  const ruleData = {
    name: 'Test Event-Based Invoice Creation',
    description: 'Create invoice when contract is generated',
    type: 'INVOICING',
    trigger: 'EVENT_BASED',
    conditions: {
      eventType: 'CONTRACT_GENERATED'
    },
    actions: [
      {
        type: 'CREATE_INVOICE',
        clientId: '{{event.clientId}}',
        freelancerId: '{{event.freelancerId}}',
        jobId: '{{event.jobId}}',
        title: 'Invoice for {{event.title}}',
        description: 'Automatically generated invoice',
        items: [
          {
            description: 'Service Fee',
            quantity: 1,
            rate: 100
          }
        ],
        taxRate: 10,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    ],
    priority: 10
  };

  const result = await apiCall('/automation/rules', {
    method: 'POST',
    body: JSON.stringify(ruleData)
  });

  if (result.status === 201 && result.data.data?.rule) {
    console.log('✅ Event-based rule created');
    console.log(`   Rule ID: ${result.data.data.rule.id}`);
    return true;
  } else {
    console.log('❌ Event-based rule creation failed:', result.data);
    return false;
  }
}

async function testManualExecution() {
  console.log('\n▶️  Testing Manual Rule Execution...');
  
  if (!testRuleId) {
    console.log('⚠️  Skipping (no test rule available)');
    return false;
  }

  const result = await apiCall(`/automation/rules/${testRuleId}/execute`, {
    method: 'POST'
  });

  if (result.status === 200) {
    console.log('✅ Manual execution successful');
    console.log(`   Status: ${result.data.data?.status}`);
    console.log(`   Duration: ${result.data.data?.duration}ms`);
    return true;
  } else {
    console.log('❌ Manual execution failed:', result.data);
    return false;
  }
}

async function testEmailCampaign() {
  console.log('\n📧 Testing Email Campaign Creation...');
  
  const campaignData = {
    name: 'Test Welcome Campaign',
    description: 'Welcome email for new users',
    type: 'WELCOME',
    subject: 'Welcome to Brenda!',
    content: '<h1>Welcome!</h1><p>Thanks for joining our platform.</p>',
    recipients: [TEST_USER.email],
    filters: {},
    schedule: {},
    scheduledAt: new Date(Date.now() + 2 * 60 * 1000).toISOString() // 2 minutes from now
  };

  const result = await apiCall('/automation/email-campaigns', {
    method: 'POST',
    body: JSON.stringify(campaignData)
  });

  if (result.status === 201 && result.data.data?.campaign) {
    testCampaignId = result.data.data.campaign.id;
    console.log('✅ Email campaign created');
    console.log(`   Campaign ID: ${testCampaignId}`);
    return true;
  } else {
    console.log('❌ Email campaign creation failed:', result.data);
    return false;
  }
}

async function testLeadScoring() {
  console.log('\n🎯 Testing Lead Scoring...');
  
  const scoreData = {
    leadId: testUserId,
    leadType: 'USER',
    factors: {
      profileCompleteness: 8,
      verificationStatus: true,
      responseTime: 5,
      portfolioQuality: 7,
      reviewRating: 4.5,
      jobHistory: 3
    }
  };

  const result = await apiCall('/automation/lead-scores/calculate', {
    method: 'POST',
    body: JSON.stringify(scoreData)
  });

  if (result.status === 200 && result.data.data?.leadScore) {
    console.log('✅ Lead score calculated');
    console.log(`   Score: ${result.data.data.leadScore.score}/100`);
    return true;
  } else {
    console.log('❌ Lead scoring failed:', result.data);
    return false;
  }
}

async function testReminder() {
  console.log('\n⏰ Testing Reminder Creation...');
  
  const reminderData = {
    title: 'Test Reminder',
    description: 'This is a test reminder',
    type: 'CUSTOM',
    dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    priority: 'HIGH'
  };

  const result = await apiCall('/automation/reminders', {
    method: 'POST',
    body: JSON.stringify(reminderData)
  });

  if (result.status === 201 && result.data.data?.reminder) {
    console.log('✅ Reminder created');
    console.log(`   ID: ${result.data.data.reminder.id}`);
    return true;
  } else {
    console.log('❌ Reminder creation failed:', result.data);
    return false;
  }
}

async function testMonitoringHealth() {
  console.log('\n📊 Testing Monitoring - System Health...');
  
  const result = await apiCall('/monitoring/health');

  if (result.status === 200 && result.data.data) {
    const { summary, recentActivity, topRules } = result.data.data;
    console.log('✅ Health check successful');
    console.log(`   Total Rules: ${summary.totalRules}`);
    console.log(`   Active Rules: ${summary.activeRules}`);
    console.log(`   Total Executions: ${summary.totalExecutions}`);
    console.log(`   Success Rate: ${summary.successRate}%`);
    console.log(`   Recent Activity: ${recentActivity.length} logs`);
    return true;
  } else {
    console.log('❌ Health check failed:', result.data);
    return false;
  }
}

async function testMonitoringLogs() {
  console.log('\n📜 Testing Monitoring - Execution Logs...');
  
  const result = await apiCall('/monitoring/logs?limit=10');

  if (result.status === 200 && result.data.data) {
    console.log('✅ Logs retrieved');
    console.log(`   Total Logs: ${result.data.data.pagination.total}`);
    console.log(`   Showing: ${result.data.data.logs.length}`);
    return true;
  } else {
    console.log('❌ Log retrieval failed:', result.data);
    return false;
  }
}

async function testRuleMetrics() {
  console.log('\n📈 Testing Monitoring - Rule Metrics...');
  
  if (!testRuleId) {
    console.log('⚠️  Skipping (no test rule available)');
    return false;
  }

  const result = await apiCall(`/monitoring/rules/${testRuleId}/metrics`);

  if (result.status === 200 && result.data.data) {
    const { rule, metrics } = result.data.data;
    console.log('✅ Rule metrics retrieved');
    console.log(`   Rule: ${rule.name}`);
    console.log(`   Total Runs: ${metrics.totalRuns}`);
    console.log(`   Success Rate: ${metrics.successRate}%`);
    console.log(`   Avg Duration: ${metrics.avgDuration}ms`);
    return true;
  } else {
    console.log('❌ Rule metrics retrieval failed:', result.data);
    return false;
  }
}

async function testActionHandlers() {
  console.log('\n🔧 Testing All Action Handlers...');
  
  const multiActionRule = {
    name: 'Test All Actions',
    description: 'Tests all available action types',
    type: 'CUSTOM',
    trigger: 'MANUAL',
    conditions: {},
    actions: [
      {
        type: 'CREATE_REMINDER',
        userId: testUserId,
        title: 'Test Action Reminder',
        description: 'Created via automation action',
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        priority: 'MEDIUM'
      }
    ]
  };

  // Create the rule
  const createResult = await apiCall('/automation/rules', {
    method: 'POST',
    body: JSON.stringify(multiActionRule)
  });

  if (createResult.status !== 201) {
    console.log('❌ Multi-action rule creation failed');
    return false;
  }

  const ruleId = createResult.data.data.rule.id;

  // Execute it
  const execResult = await apiCall(`/automation/rules/${ruleId}/execute`, {
    method: 'POST'
  });

  if (execResult.status === 200) {
    console.log('✅ All actions executed');
    console.log(`   Status: ${execResult.data.data?.status}`);
    return true;
  } else {
    console.log('❌ Action execution failed:', execResult.data);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   BRENDA AUTOMATION SYSTEM - COMPREHENSIVE TEST SUITE  ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\nTesting against: ${API_BASE_URL}`);
  console.log(`Time: ${new Date().toISOString()}\n`);

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Authentication', fn: testAuthentication },
    { name: 'Scheduled Rule', fn: testScheduledRule },
    { name: 'Event-Based Rule', fn: testEventBasedRule },
    { name: 'Manual Execution', fn: testManualExecution },
    { name: 'Email Campaign', fn: testEmailCampaign },
    { name: 'Lead Scoring', fn: testLeadScoring },
    { name: 'Reminder', fn: testReminder },
    { name: 'Action Handlers', fn: testActionHandlers },
    { name: 'System Health', fn: testMonitoringHealth },
    { name: 'Execution Logs', fn: testMonitoringLogs },
    { name: 'Rule Metrics', fn: testRuleMetrics }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error:`, error.message);
      results.failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('TEST SUMMARY');
  console.log('═'.repeat(60));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`);
  console.log('═'.repeat(60));

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Automation system is working correctly.\n');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) failed. Please review the output above.\n`);
  }
}

// Run the test suite
runTests().catch(err => {
  console.error('\n❌ Test suite crashed:', err);
  process.exit(1);
});
