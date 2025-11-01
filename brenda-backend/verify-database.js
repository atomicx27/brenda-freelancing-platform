// Quick Database Verification Script
// Run this to verify database is properly set up

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyDatabase() {
  console.log('\n🔍 Verifying Database Setup...\n');
  
  const tests = [];
  
  try {
    // Test 1: Check AutomationRule table
    try {
      const ruleCount = await prisma.automationRule.count();
      tests.push({ name: 'AutomationRule table', status: '✅', message: `Found ${ruleCount} rules` });
    } catch (error) {
      tests.push({ name: 'AutomationRule table', status: '❌', message: error.message });
    }
    
    // Test 2: Check EmailCampaign table
    try {
      const campaignCount = await prisma.emailCampaign.count();
      tests.push({ name: 'EmailCampaign table', status: '✅', message: `Found ${campaignCount} campaigns` });
    } catch (error) {
      tests.push({ name: 'EmailCampaign table', status: '❌', message: error.message });
    }
    
    // Test 3: Check SmartContract table
    try {
      const contractCount = await prisma.smartContract.count();
      tests.push({ name: 'SmartContract table', status: '✅', message: `Found ${contractCount} contracts` });
    } catch (error) {
      tests.push({ name: 'SmartContract table', status: '❌', message: error.message });
    }
    
    // Test 4: Check Invoice table
    try {
      const invoiceCount = await prisma.invoice.count();
      tests.push({ name: 'Invoice table', status: '✅', message: `Found ${invoiceCount} invoices` });
    } catch (error) {
      tests.push({ name: 'Invoice table', status: '❌', message: error.message });
    }
    
    // Test 5: Check Reminder table
    try {
      const reminderCount = await prisma.reminder.count();
      tests.push({ name: 'Reminder table', status: '✅', message: `Found ${reminderCount} reminders` });
    } catch (error) {
      tests.push({ name: 'Reminder table', status: '❌', message: error.message });
    }
    
    // Test 6: Check LeadScore table
    try {
      const leadCount = await prisma.leadScore.count();
      tests.push({ name: 'LeadScore table', status: '✅', message: `Found ${leadCount} lead scores` });
    } catch (error) {
      tests.push({ name: 'LeadScore table', status: '❌', message: error.message });
    }
    
    // Test 7: Check AutomationLog table
    try {
      const logCount = await prisma.automationLog.count();
      tests.push({ name: 'AutomationLog table', status: '✅', message: `Found ${logCount} logs` });
    } catch (error) {
      tests.push({ name: 'AutomationLog table', status: '❌', message: error.message });
    }
    
    // Print results
    console.log('═'.repeat(60));
    console.log('DATABASE VERIFICATION RESULTS');
    console.log('═'.repeat(60));
    
    tests.forEach(test => {
      console.log(`${test.status} ${test.name.padEnd(30)} - ${test.message}`);
    });
    
    const passed = tests.filter(t => t.status === '✅').length;
    const failed = tests.filter(t => t.status === '❌').length;
    
    console.log('\n' + '═'.repeat(60));
    console.log(`Total Tests: ${tests.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / tests.length) * 100)}%`);
    console.log('═'.repeat(60));
    
    if (failed === 0) {
      console.log('\n🎉 DATABASE IS CORRECTLY CONFIGURED!\n');
      console.log('✅ All automation tables exist and are accessible');
      console.log('✅ Backend can query the database successfully');
      console.log('✅ Ready to create automation rules\n');
    } else {
      console.log('\n⚠️  Some tables are missing or inaccessible');
      console.log('Run: npx prisma db push\n');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
