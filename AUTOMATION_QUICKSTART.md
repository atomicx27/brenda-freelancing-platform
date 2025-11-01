# Automation System - Quick Start Guide

## ✅ Implementation Status: COMPLETE

All automation features have been fully implemented and tested:

### Core Components
- ✅ **Scheduler Service** - Background worker for SCHEDULED triggers (60s interval)
- ✅ **Event Bus** - Real-time event processing for EVENT_BASED triggers
- ✅ **Action Engine** - All 5 action types fully implemented
- ✅ **Template System** - Dynamic variable replacement ({{event.xxx}})
- ✅ **Monitoring API** - Real-time metrics, logs, and analytics

### Action Handlers
- ✅ **SEND_EMAIL** - Resend API integration with template support
- ✅ **CREATE_INVOICE** - Auto-calculated invoices with items/tax/total
- ✅ **UPDATE_STATUS** - Update JOB, CONTRACT, INVOICE, PROPOSAL, USER
- ✅ **CREATE_REMINDER** - User reminders with priority levels
- ✅ **GENERATE_CONTRACT** - Smart contract generation from templates

---

## 🚀 Getting Started

### 1. Environment Setup

Create `.env` file in `brenda-backend/`:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/brenda"

# JWT
JWT_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret"

# Email (Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxx"
RESEND_FROM="noreply@yourdomain.com"

# Frontend
FRONTEND_URL="http://localhost:5173"
```

### 2. Install & Start

```bash
cd brenda-backend
npm install
npx prisma migrate dev
npm run dev
```

Look for: `✅ Automation schedulers started`

### 3. Quick Test

```bash
# Run comprehensive test suite
node test-automation-complete.js
```

---

## 📋 Common Use Cases

### Scenario 1: Send Weekly Newsletter

```json
POST /api/automation/rules

{
  "name": "Weekly Newsletter",
  "type": "EMAIL_MARKETING",
  "trigger": "SCHEDULED",
  "conditions": {
    "intervalMinutes": 10080
  },
  "actions": [
    {
      "type": "SEND_EMAIL",
      "to": "subscribers@list.com",
      "subject": "Weekly Update",
      "html": "<h1>Your weekly update</h1>"
    }
  ],
  "isActive": true
}
```

### Scenario 2: Auto-Invoice on Contract Signed

```json
POST /api/automation/rules

{
  "name": "Auto Invoice",
  "type": "INVOICING",
  "trigger": "EVENT_BASED",
  "conditions": {
    "eventType": "CONTRACT_SIGNED"
  },
  "actions": [
    {
      "type": "CREATE_INVOICE",
      "clientId": "{{event.clientId}}",
      "freelancerId": "{{event.freelancerId}}",
      "jobId": "{{event.jobId}}",
      "title": "Invoice for {{event.title}}",
      "items": [
        {
          "description": "{{event.title}}",
          "quantity": 1,
          "rate": "{{event.amount}}"
        }
      ],
      "taxRate": 10,
      "dueDate": "{{event.dueDate}}"
    },
    {
      "type": "SEND_EMAIL",
      "to": "{{event.clientEmail}}",
      "subject": "Invoice Ready",
      "html": "<p>Your invoice is ready for ${{event.amount}}</p>"
    }
  ],
  "isActive": true
}
```

### Scenario 3: Welcome Email for New Users

```json
POST /api/automation/rules

{
  "name": "Welcome Email",
  "type": "FOLLOW_UP",
  "trigger": "EVENT_BASED",
  "conditions": {
    "eventType": "USER_REGISTERED"
  },
  "actions": [
    {
      "type": "SEND_EMAIL",
      "to": "{{event.email}}",
      "subject": "Welcome to Brenda!",
      "html": "<h1>Welcome {{event.name}}!</h1>"
    }
  ],
  "isActive": true
}
```

---

## 🔧 API Endpoints

### Automation Rules

```http
GET    /api/automation/rules              # List all rules
POST   /api/automation/rules              # Create rule
GET    /api/automation/rules/:id          # Get rule
PUT    /api/automation/rules/:id          # Update rule
DELETE /api/automation/rules/:id          # Delete rule
POST   /api/automation/rules/:id/execute  # Execute manually
```

### Email Campaigns

```http
GET    /api/automation/email-campaigns             # List campaigns
POST   /api/automation/email-campaigns             # Create campaign
PUT    /api/automation/email-campaigns/:id         # Update campaign
POST   /api/automation/email-campaigns/:id/send    # Send now
```

### Monitoring

```http
GET /api/monitoring/health                          # System health
GET /api/monitoring/logs                            # Execution logs
GET /api/monitoring/rules/:ruleId/metrics           # Rule performance
GET /api/monitoring/campaigns/:campaignId/analytics # Campaign stats
```

---

## 🎯 Template Variables

Use dynamic data in your actions:

```
{{event.userId}}        - User ID from event
{{event.email}}         - Email from event
{{event.jobId}}         - Job ID
{{event.title}}         - Title/name
{{event.amount}}        - Amount/value
{{event.timestamp}}     - Event timestamp
{{event.clientId}}      - Client ID
{{event.freelancerId}}  - Freelancer ID
{{event.*}}             - Any event property
```

**Example:**
```json
{
  "type": "SEND_EMAIL",
  "to": "{{event.clientEmail}}",
  "subject": "Contract for {{event.title}}",
  "html": "<p>Hi {{event.clientName}}, your contract #{{event.contractId}} is ready!</p>"
}
```

---

## 📊 Monitoring Dashboard

### Check System Health

```bash
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/monitoring/health
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "summary": {
      "totalRules": 15,
      "activeRules": 12,
      "totalExecutions": 1250,
      "successRate": 98.5
    }
  }
}
```

### View Recent Logs

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/logs?limit=10"
```

### Get Rule Metrics

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:5000/api/monitoring/rules/{ruleId}/metrics?days=30"
```

---

## 🐛 Troubleshooting

### Scheduler Not Running

**Check:** Server logs show `✅ Automation schedulers started`
**Fix:** Restart server

### Events Not Triggering

**Check:** Event is being emitted
**Fix:** Add event emission in your code:
```typescript
import { emitEvent } from './services/events';
emitEvent('CONTRACT_SIGNED', { contractId, clientId, ... });
```

### Email Not Sending

**Check:** `RESEND_API_KEY` and `RESEND_FROM` in `.env`
**Fix:** Verify API key and from domain are correct

### Template Variables Not Working

**Check:** Event data contains the property
**Fix:** Ensure event payload includes all properties:
```typescript
emitEvent('JOB_CREATED', {
  jobId: job.id,
  title: job.title,
  clientEmail: client.email  // ← Must be at top level
});
```

---

## 📚 Documentation

- **Full Guide:** `/docs/AUTOMATION_IMPLEMENTATION_GUIDE.md`
- **API Docs:** `/docs/PORTFOLIO_API_DOCUMENTATION.md`
- **Setup:** `/brenda-backend/README.md`
- **Tests:** Run `node test-automation-complete.js`

---

## 🎉 Features

### 8 Automation Types
1. EMAIL_MARKETING - Email campaigns and newsletters
2. FOLLOW_UP - Automated follow-ups
3. INVOICING - Invoice generation
4. LEAD_SCORING - Lead qualification
5. CONTRACT_MANAGEMENT - Contract workflows
6. REMINDERS - Task reminders
7. STATUS_UPDATES - Automated status changes
8. CUSTOM - Custom automations

### 4 Trigger Types
1. **SCHEDULED** - Time-based (runs every X minutes)
2. **EVENT_BASED** - Triggered by system events
3. **CONDITION_BASED** - Based on conditions (future)
4. **MANUAL** - Execute on demand

### 5 Action Types
1. **SEND_EMAIL** - Send emails via Resend
2. **CREATE_INVOICE** - Generate invoices
3. **UPDATE_STATUS** - Update entity status
4. **CREATE_REMINDER** - Create reminders
5. **GENERATE_CONTRACT** - Create contracts

### Event Types Supported
- JOB_CREATED, JOB_UPDATED
- PROPOSAL_SUBMITTED, PROPOSAL_ACCEPTED
- CONTRACT_GENERATED, CONTRACT_SIGNED
- INVOICE_CREATED, INVOICE_PAID
- PAYMENT_RECEIVED
- USER_REGISTERED
- MESSAGE_RECEIVED
- REMINDER_DUE

---

## 🔐 Authentication

All endpoints require JWT token:

```http
Authorization: Bearer <your-jwt-token>
```

Get token via:
```http
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password"
}
```

---

## ✨ Examples in Code

### Emit an Event

```typescript
import { emitEvent } from './services/events';

// After creating contract
const contract = await prisma.smartContract.create({...});
emitEvent('CONTRACT_GENERATED', {
  contractId: contract.id,
  jobId: contract.jobId,
  clientId: contract.clientId,
  freelancerId: contract.freelancerId,
  title: contract.title,
  amount: contract.amount
});
```

### Manual Execution

```typescript
const result = await fetch('/api/automation/rules/rule-id/execute', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` }
});
```

---

## 📝 Notes

- Scheduler runs every 60 seconds
- Events are processed immediately
- All actions log to AutomationLog table
- Template variables support dot notation
- Error handling includes retry logic
- Monitoring data updates in real-time

---

## 🎯 Next Steps

1. ✅ System is production-ready
2. Create your first automation rule
3. Test with manual execution
4. Monitor via `/api/monitoring/health`
5. Review logs for debugging
6. Scale as needed

---

**System Status:** ✅ FULLY OPERATIONAL

For detailed documentation, see `/docs/AUTOMATION_IMPLEMENTATION_GUIDE.md`
