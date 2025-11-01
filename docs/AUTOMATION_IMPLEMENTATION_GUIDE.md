# Brenda Automation System - Complete Implementation Guide

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Setup & Configuration](#setup--configuration)
5. [API Reference](#api-reference)
6. [Usage Examples](#usage-examples)
7. [Monitoring & Analytics](#monitoring--analytics)
8. [Testing](#testing)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

The Brenda Automation System is a comprehensive workflow automation platform that supports:
- **8 Automation Types**: Email Marketing, Follow-ups, Invoicing, Lead Scoring, Contract Management, Reminders, Status Updates, Custom
- **4 Trigger Types**: Scheduled, Event-Based, Condition-Based, Manual
- **5 Action Types**: Send Email, Create Invoice, Update Status, Create Reminder, Generate Contract

### Key Components
- **Scheduler Service**: Background worker for SCHEDULED triggers (runs every 60 seconds)
- **Event Bus**: Event-driven system for EVENT_BASED triggers using Node.js EventEmitter
- **Action Engine**: Executes automation actions with template variable support
- **Monitoring API**: Real-time metrics, logs, and analytics

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     API Layer (Express)                      │
│  /api/automation/*  |  /api/monitoring/*  |  /api/jobs/*    │
└───────────────┬─────────────────────────────────────────────┘
                │
    ┌───────────┴───────────┐
    │                       │
┌───▼────────────┐  ┌──────▼──────────┐
│   Scheduler    │  │   Event Bus     │
│   (SCHEDULED)  │  │ (EVENT_BASED)   │
└───┬────────────┘  └──────┬──────────┘
    │                      │
    └──────────┬───────────┘
               │
      ┌────────▼─────────┐
      │  Action Engine   │
      │  - SEND_EMAIL    │
      │  - CREATE_INVOICE│
      │  - UPDATE_STATUS │
      │  - CREATE_REMINDER│
      │  - GENERATE_CONTRACT│
      └────────┬─────────┘
               │
        ┌──────▼──────┐
        │   Database  │
        │  (Prisma)   │
        └─────────────┘
```

### Data Flow

1. **SCHEDULED Trigger**:
   ```
   Scheduler (60s interval) → Check nextRun → Execute Actions → Update nextRun
   ```

2. **EVENT_BASED Trigger**:
   ```
   Domain Event → Event Bus → Match Rules → Evaluate Conditions → Execute Actions
   ```

3. **MANUAL Trigger**:
   ```
   API Request → Validate Rule → Execute Actions → Return Results
   ```

---

## Features

### 1. Scheduled Automation (SCHEDULED Trigger)

Automatically execute actions at regular intervals.

**Configuration**:
```json
{
  "conditions": {
    "intervalMinutes": 60  // Run every hour
  }
}
```

**Use Cases**:
- Send weekly newsletter
- Generate monthly invoices
- Daily reminder emails
- Periodic status updates

**Scheduler Details**:
- Runs every 60 seconds
- Processes all active SCHEDULED rules
- Updates `nextRun` timestamp automatically
- Logs all executions to `AutomationLog`

### 2. Event-Based Automation (EVENT_BASED Trigger)

React to system events in real-time.

**Supported Events**:
```typescript
enum EventType {
  JOB_CREATED = 'JOB_CREATED',
  JOB_UPDATED = 'JOB_UPDATED',
  PROPOSAL_SUBMITTED = 'PROPOSAL_SUBMITTED',
  PROPOSAL_ACCEPTED = 'PROPOSAL_ACCEPTED',
  CONTRACT_GENERATED = 'CONTRACT_GENERATED',
  CONTRACT_SIGNED = 'CONTRACT_SIGNED',
  INVOICE_CREATED = 'INVOICE_CREATED',
  INVOICE_PAID = 'INVOICE_PAID',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  USER_REGISTERED = 'USER_REGISTERED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',
  REMINDER_DUE = 'REMINDER_DUE'
}
```

**Configuration**:
```json
{
  "conditions": {
    "eventType": "CONTRACT_GENERATED",
    "filters": {
      "amount": { "$gte": 1000 }
    }
  }
}
```

**Condition Operators**:
- `$eq`: Equals
- `$ne`: Not equals
- `$gt`: Greater than
- `$gte`: Greater than or equal
- `$lt`: Less than
- `$lte`: Less than or equal
- `$in`: In array
- `$nin`: Not in array

### 3. Template Variables

Actions support dynamic template variables that are replaced with event data.

**Syntax**: `{{event.propertyName}}`

**Example**:
```json
{
  "type": "SEND_EMAIL",
  "to": "{{event.clientEmail}}",
  "subject": "Contract for {{event.title}}",
  "html": "<p>Dear {{event.clientName}},</p><p>Your contract #{{event.contractId}} is ready.</p>"
}
```

**Available Variables**:
- `{{event.*}}`: Any property from the event payload
- `{{event.timestamp}}`: ISO timestamp of event
- `{{event.userId}}`: User who triggered the event
- `{{event.jobId}}`: Associated job ID
- Custom properties from event data

### 4. Action Types

#### SEND_EMAIL
Sends email using Resend API.

```json
{
  "type": "SEND_EMAIL",
  "to": "user@example.com",
  "subject": "Your Subject",
  "html": "<h1>Email content</h1>",
  "from": "noreply@brenda.com"  // Optional, uses RESEND_FROM env var
}
```

#### CREATE_INVOICE
Generates invoice with automatic calculations.

```json
{
  "type": "CREATE_INVOICE",
  "clientId": "client-uuid",
  "freelancerId": "freelancer-uuid",
  "jobId": "job-uuid",
  "title": "Invoice for Website Design",
  "description": "Monthly billing",
  "items": [
    {
      "description": "Design Services",
      "quantity": 10,
      "rate": 50
    }
  ],
  "taxRate": 10,
  "dueDate": "2024-02-01T00:00:00Z"
}
```

**Auto-calculated**: `subtotal`, `taxAmount`, `total`

#### UPDATE_STATUS
Updates status of various entities.

```json
{
  "type": "UPDATE_STATUS",
  "entityType": "JOB",  // JOB, CONTRACT, INVOICE, PROPOSAL, USER
  "entityId": "entity-uuid",
  "status": "IN_PROGRESS",
  "metadata": {
    "reason": "Automated update",
    "updatedBy": "automation"
  }
}
```

#### CREATE_REMINDER
Creates reminder for user.

```json
{
  "type": "CREATE_REMINDER",
  "userId": "user-uuid",
  "title": "Payment Due",
  "description": "Invoice #123 is due today",
  "type": "PAYMENT",
  "dueDate": "2024-02-01T00:00:00Z",
  "priority": "HIGH"
}
```

**Reminder Types**: `PAYMENT`, `DEADLINE`, `FOLLOW_UP`, `CUSTOM`

#### GENERATE_CONTRACT
Generates smart contract from template.

```json
{
  "type": "GENERATE_CONTRACT",
  "jobId": "job-uuid",
  "clientId": "client-uuid",
  "freelancerId": "freelancer-uuid",
  "title": "Freelance Agreement",
  "description": "Project contract",
  "terms": "Full project scope and deliverables...",
  "amount": 5000,
  "startDate": "2024-02-01T00:00:00Z",
  "endDate": "2024-03-01T00:00:00Z",
  "paymentTerms": "Net 30"
}
```

---

## Setup & Configuration

### Environment Variables

Required environment variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/brenda"

# JWT Authentication
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email Service (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM="noreply@yourdomain.com"

# Frontend URL
FRONTEND_URL="http://localhost:5173"
```

### Installation

1. **Install Dependencies**:
```bash
cd brenda-backend
npm install
```

2. **Setup Database**:
```bash
npx prisma migrate dev
npx prisma generate
```

3. **Start Development Server**:
```bash
npm run dev
```

The scheduler will start automatically and log:
```
✅ Automation schedulers started
```

### Verify Installation

Check scheduler is running:
```bash
curl http://localhost:5000/api/monitoring/health
```

Expected response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRules": 0,
      "activeRules": 0,
      "totalExecutions": 0,
      "successRate": 0
    },
    "recentActivity": [],
    "topRules": []
  }
}
```

---

## API Reference

### Authentication

All endpoints require JWT authentication. Include token in header:
```
Authorization: Bearer <your-jwt-token>
```

### Automation Rules

#### Create Rule
```http
POST /api/automation/rules
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "Weekly Newsletter",
  "description": "Send newsletter every Monday",
  "type": "EMAIL_MARKETING",
  "trigger": "SCHEDULED",
  "conditions": {
    "intervalMinutes": 10080  // 7 days
  },
  "actions": [
    {
      "type": "SEND_EMAIL",
      "to": "subscribers@list.com",
      "subject": "Weekly Update",
      "html": "<h1>This week...</h1>"
    }
  ],
  "priority": 5,
  "isActive": true
}
```

#### List Rules
```http
GET /api/automation/rules?type=EMAIL_MARKETING&trigger=SCHEDULED&status=active
```

#### Get Rule
```http
GET /api/automation/rules/:ruleId
```

#### Update Rule
```http
PUT /api/automation/rules/:ruleId
```

#### Delete Rule
```http
DELETE /api/automation/rules/:ruleId
```

#### Execute Rule Manually
```http
POST /api/automation/rules/:ruleId/execute
```

### Email Campaigns

#### Create Campaign
```http
POST /api/automation/email-campaigns
Content-Type: application/json

{
  "name": "Welcome Series",
  "description": "Welcome email for new users",
  "type": "WELCOME",
  "subject": "Welcome to Brenda!",
  "content": "<h1>Welcome!</h1>",
  "recipients": ["user@example.com"],
  "scheduledAt": "2024-02-01T10:00:00Z"
}
```

#### List Campaigns
```http
GET /api/automation/email-campaigns?status=SCHEDULED
```

#### Update Campaign
```http
PUT /api/automation/email-campaigns/:campaignId
```

#### Send Campaign Now
```http
POST /api/automation/email-campaigns/:campaignId/send
```

### Lead Scoring

#### Calculate Lead Score
```http
POST /api/automation/lead-scores/calculate
Content-Type: application/json

{
  "leadId": "user-uuid",
  "leadType": "USER",
  "factors": {
    "profileCompleteness": 8,
    "verificationStatus": true,
    "responseTime": 5,
    "portfolioQuality": 7,
    "reviewRating": 4.5
  }
}
```

### Reminders

#### Create Reminder
```http
POST /api/automation/reminders
Content-Type: application/json

{
  "title": "Follow up with client",
  "description": "Discuss project timeline",
  "type": "FOLLOW_UP",
  "dueDate": "2024-02-01T10:00:00Z",
  "priority": "HIGH"
}
```

#### List Reminders
```http
GET /api/automation/reminders?status=PENDING&priority=HIGH
```

### Monitoring

#### System Health
```http
GET /api/monitoring/health
```

Response:
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRules": 15,
      "activeRules": 12,
      "totalExecutions": 1250,
      "successRate": 98.5
    },
    "recentActivity": [...],
    "topRules": [...]
  }
}
```

#### Execution Logs
```http
GET /api/monitoring/logs?ruleId=uuid&status=success&limit=50&offset=0
```

#### Rule Metrics
```http
GET /api/monitoring/rules/:ruleId/metrics?days=30
```

Response:
```json
{
  "success": true,
  "data": {
    "rule": {...},
    "metrics": {
      "totalRuns": 120,
      "successCount": 118,
      "failureCount": 2,
      "successRate": 98.3,
      "avgDuration": 245,
      "lastRun": "2024-01-15T10:00:00Z"
    },
    "recentLogs": [...]
  }
}
```

#### Campaign Analytics
```http
GET /api/monitoring/campaigns/:campaignId/analytics
```

---

## Usage Examples

### Example 1: Automated Invoice Generation

Create a rule that generates an invoice when a contract is signed:

```javascript
const rule = {
  name: "Auto Invoice on Contract",
  description: "Create invoice when contract is signed",
  type: "INVOICING",
  trigger: "EVENT_BASED",
  conditions: {
    eventType: "CONTRACT_SIGNED",
    filters: {
      "amount": { "$gte": 100 }  // Only for contracts >= $100
    }
  },
  actions: [
    {
      type: "CREATE_INVOICE",
      clientId: "{{event.clientId}}",
      freelancerId: "{{event.freelancerId}}",
      jobId: "{{event.jobId}}",
      title: "Invoice for {{event.title}}",
      description: "Payment for signed contract",
      items: [
        {
          description: "{{event.title}}",
          quantity: 1,
          rate: "{{event.amount}}"
        }
      ],
      taxRate: 10,
      dueDate: "{{event.dueDate}}"
    },
    {
      type: "SEND_EMAIL",
      to: "{{event.clientEmail}}",
      subject: "Invoice Ready - {{event.title}}",
      html: "<p>Your invoice is ready. Amount: ${{event.amount}}</p>"
    }
  ],
  priority: 10,
  isActive: true
};

// Create the rule
const response = await fetch('http://localhost:5000/api/automation/rules', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(rule)
});
```

### Example 2: Weekly Status Report

Send weekly status report every Monday at 9 AM:

```javascript
const rule = {
  name: "Weekly Status Report",
  description: "Send status report every Monday",
  type: "EMAIL_MARKETING",
  trigger: "SCHEDULED",
  conditions: {
    intervalMinutes: 10080,  // 7 days
    startTime: "09:00"
  },
  actions: [
    {
      type: "SEND_EMAIL",
      to: "team@company.com",
      subject: "Weekly Status Report",
      html: `
        <h1>Weekly Status Report</h1>
        <p>Generated: {{event.timestamp}}</p>
        <ul>
          <li>Active Projects: Check dashboard</li>
          <li>Pending Payments: Review invoices</li>
        </ul>
      `
    }
  ],
  priority: 5,
  isActive: true
};
```

### Example 3: Lead Nurturing Sequence

Automatically follow up with new leads:

```javascript
const rule = {
  name: "New Lead Follow-up",
  description: "Send welcome email to new registered users",
  type: "FOLLOW_UP",
  trigger: "EVENT_BASED",
  conditions: {
    eventType: "USER_REGISTERED",
    filters: {
      "userType": { "$eq": "CLIENT" }
    }
  },
  actions: [
    {
      type: "SEND_EMAIL",
      to: "{{event.email}}",
      subject: "Welcome to Brenda!",
      html: `
        <h1>Welcome {{event.name}}!</h1>
        <p>We're excited to have you on board.</p>
      `
    },
    {
      type: "CREATE_REMINDER",
      userId: "{{event.userId}}",
      title: "Follow up with {{event.name}}",
      description: "Check if user needs help",
      type: "FOLLOW_UP",
      dueDate: "{{event.followUpDate}}",
      priority: "MEDIUM"
    }
  ],
  priority: 8,
  isActive: true
};
```

### Example 4: Payment Reminder

Remind clients about unpaid invoices:

```javascript
const rule = {
  name: "Payment Reminder",
  description: "Remind clients 3 days before invoice due date",
  type: "INVOICING",
  trigger: "SCHEDULED",
  conditions: {
    intervalMinutes: 1440  // Check daily
  },
  actions: [
    {
      type: "SEND_EMAIL",
      to: "{{event.clientEmail}}",
      subject: "Payment Reminder - Invoice {{event.invoiceNumber}}",
      html: `
        <p>Dear {{event.clientName}},</p>
        <p>This is a reminder that invoice {{event.invoiceNumber}} 
           totaling ${{event.amount}} is due on {{event.dueDate}}.</p>
      `
    }
  ],
  priority: 7,
  isActive: true
};
```

---

## Monitoring & Analytics

### Dashboard Metrics

Access real-time automation metrics:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/monitoring/health
```

Key metrics:
- **Total Rules**: Number of automation rules created
- **Active Rules**: Currently enabled rules
- **Total Executions**: All-time execution count
- **Success Rate**: Percentage of successful executions
- **Recent Activity**: Last 10 executions
- **Top Rules**: Most frequently executed rules

### Execution Logs

View detailed execution history:

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/logs?status=failure&limit=20"
```

Filter options:
- `ruleId`: Specific rule
- `status`: success, failure, partial
- `startDate`: Date range start
- `endDate`: Date range end
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset

### Rule Performance

Analyze individual rule performance:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/monitoring/rules/{ruleId}/metrics?days=30
```

Metrics include:
- Total runs in period
- Success/failure counts
- Success rate percentage
- Average execution duration
- Last execution timestamp
- Recent execution logs

### Campaign Analytics

Track email campaign performance:

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/monitoring/campaigns/{campaignId}/analytics
```

Analytics:
- Campaign details
- Recipient count
- Send status
- Open/click rates (if tracking enabled)
- Delivery timestamps

---

## Testing

### Automated Test Suite

Run comprehensive test suite:

```bash
cd brenda-backend
node test-automation-complete.js
```

The test suite covers:
1. ✅ Authentication
2. ✅ Scheduled rule creation
3. ✅ Event-based rule creation
4. ✅ Manual rule execution
5. ✅ Email campaign creation
6. ✅ Lead scoring
7. ✅ Reminder creation
8. ✅ Action handlers
9. ✅ System health monitoring
10. ✅ Execution logs
11. ✅ Rule metrics

### Manual Testing

#### Test Scheduled Rule

1. Create a rule with 1-minute interval:
```bash
curl -X POST http://localhost:5000/api/automation/rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Scheduled",
    "type": "CUSTOM",
    "trigger": "SCHEDULED",
    "conditions": {"intervalMinutes": 1},
    "actions": [{"type": "SEND_EMAIL", "to": "test@example.com", "subject": "Test", "html": "<p>Test</p>"}],
    "isActive": true
  }'
```

2. Wait 1-2 minutes

3. Check logs:
```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/monitoring/logs
```

#### Test Event-Based Rule

1. Create event-based rule:
```bash
curl -X POST http://localhost:5000/api/automation/rules \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Event",
    "type": "CUSTOM",
    "trigger": "EVENT_BASED",
    "conditions": {"eventType": "JOB_CREATED"},
    "actions": [{"type": "SEND_EMAIL", "to": "test@example.com", "subject": "New Job", "html": "<p>Job created!</p>"}],
    "isActive": true
  }'
```

2. Create a job (or trigger the event)

3. Verify execution in logs

#### Test Manual Execution

```bash
curl -X POST http://localhost:5000/api/automation/rules/{ruleId}/execute \
  -H "Authorization: Bearer <token>"
```

---

## Troubleshooting

### Common Issues

#### 1. Scheduler Not Running

**Symptom**: Scheduled rules never execute

**Solutions**:
- Check server logs for "✅ Automation schedulers started"
- Verify `isActive: true` on the rule
- Check `nextRun` timestamp in database
- Ensure `intervalMinutes` is set correctly

**Debug**:
```sql
SELECT id, name, "nextRun", "isActive" 
FROM "AutomationRule" 
WHERE trigger = 'SCHEDULED';
```

#### 2. Events Not Triggering Rules

**Symptom**: Event-based rules don't execute

**Solutions**:
- Verify event is being emitted:
  ```typescript
  import { emitEvent } from './services/events';
  emitEvent('JOB_CREATED', { jobId: '123', ... });
  ```
- Check rule conditions match event data
- Verify rule is active
- Review event bus logs

**Debug**:
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/logs?ruleId={ruleId}"
```

#### 3. Email Not Sending

**Symptom**: SEND_EMAIL action fails

**Solutions**:
- Verify `RESEND_API_KEY` in .env
- Check `RESEND_FROM` is a verified domain
- Review Resend dashboard for errors
- Check email address format

**Debug**:
```bash
# Check automation logs
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/logs?status=failure"
```

#### 4. Template Variables Not Resolving

**Symptom**: `{{event.xxx}}` shows as literal text

**Solutions**:
- Ensure event data contains the property
- Check property name spelling
- Verify event is passed to `executeAutomationActions`

**Example Fix**:
```javascript
// Wrong
emitEvent('CONTRACT_GENERATED', { contract: {...} });

// Correct - flatten properties
emitEvent('CONTRACT_GENERATED', { 
  contractId: contract.id,
  title: contract.title,
  clientId: contract.clientId 
});
```

#### 5. High Memory Usage

**Symptom**: Server memory grows over time

**Solutions**:
- Limit log retention:
  ```sql
  DELETE FROM "AutomationLog" 
  WHERE "createdAt" < NOW() - INTERVAL '30 days';
  ```
- Add log cleanup to scheduler
- Monitor active event listeners

### Performance Optimization

#### 1. Database Indexes

Ensure indexes exist:
```sql
CREATE INDEX idx_automation_rule_trigger ON "AutomationRule"(trigger);
CREATE INDEX idx_automation_rule_active ON "AutomationRule"("isActive");
CREATE INDEX idx_automation_log_rule ON "AutomationLog"("ruleId");
CREATE INDEX idx_automation_log_created ON "AutomationLog"("createdAt");
```

#### 2. Scheduler Interval

Adjust scheduler frequency in `scheduler.ts`:
```typescript
// Default: 60 seconds
setInterval(runScheduledRules, 60000);

// For high-frequency rules: 30 seconds
setInterval(runScheduledRules, 30000);

// For low-frequency rules: 5 minutes
setInterval(runScheduledRules, 300000);
```

#### 3. Batch Processing

Process multiple actions in parallel:
```typescript
// Current: Sequential
for (const action of actions) {
  await executeAction(action);
}

// Optimized: Parallel
await Promise.all(actions.map(action => executeAction(action)));
```

### Logging

Enable debug logging:

```typescript
// In scheduler.ts
console.log('[Scheduler] Checking rules:', rules.length);
console.log('[Scheduler] Executing rule:', rule.id);

// In events.ts
console.log('[Events] Event emitted:', eventType, payload);
console.log('[Events] Matching rules:', matchingRules.length);
```

### Health Checks

Monitor system health:

```bash
# Check scheduler status
curl http://localhost:5000/api/monitoring/health

# Check recent failures
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/logs?status=failure&limit=10"

# Check rule metrics
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/rules/{ruleId}/metrics"
```

---

## Best Practices

### Rule Design

1. **Use Specific Names**: "Weekly Invoice Reminder" not "Email Rule 1"
2. **Add Descriptions**: Explain what the rule does and why
3. **Set Appropriate Priority**: 1-10, higher = more important
4. **Test Before Activating**: Create inactive, test manually, then activate
5. **Monitor Performance**: Review metrics regularly

### Action Design

1. **Keep Actions Focused**: One clear purpose per action
2. **Use Template Variables**: Make actions reusable
3. **Handle Failures Gracefully**: Add fallback actions
4. **Limit Email Frequency**: Avoid spam
5. **Validate Data**: Ensure required fields exist

### Event Design

1. **Emit Flat Data**: Avoid nested objects in event payload
2. **Include Context**: Add userId, timestamp, etc.
3. **Use Consistent Naming**: Follow EVENT_NAME pattern
4. **Document Events**: List all available events
5. **Test Event Flow**: Verify events trigger rules

### Monitoring

1. **Set Up Alerts**: Monitor failure rates
2. **Review Logs Weekly**: Identify patterns
3. **Track Metrics**: Success rate, duration, frequency
4. **Clean Old Logs**: Archive or delete old data
5. **Performance Test**: Ensure rules scale

---

## Support

For issues or questions:
1. Check this guide
2. Review error logs: `/api/monitoring/logs?status=failure`
3. Test with manual execution
4. Check database state
5. Contact system administrator

---

## Changelog

### Version 1.0.0 (Current)
- ✅ Scheduler service for SCHEDULED triggers
- ✅ Event bus for EVENT_BASED triggers
- ✅ All 5 action types implemented
- ✅ Template variable system
- ✅ Monitoring API with metrics
- ✅ Comprehensive test suite
- ✅ Complete documentation

### Planned Features
- [ ] Workflow builder UI
- [ ] Advanced condition logic (AND/OR operators)
- [ ] Action chaining and dependencies
- [ ] Rate limiting per rule
- [ ] External webhook triggers
- [ ] SMS notifications
- [ ] Slack/Discord integrations
