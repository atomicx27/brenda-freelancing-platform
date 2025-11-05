# 📝 How to Create a Smart Contract (Frontend Guide)

**Platform:** Brenda Freelancing Platform  
**Date:** November 4, 2025  
**Feature:** Smart Contract Generation

---

## 🎯 Overview

The Smart Contract feature allows you to automatically generate professional service agreements with clients. Contracts are generated from templates with variable substitution, making it easy to create customized agreements quickly.

---

## 🚀 Step-by-Step Instructions

### Prerequisites
1. ✅ Backend server running on port 5000
2. ✅ Frontend running on port 3001
3. ✅ You must be logged in as a FREELANCER or CLIENT

---

### Step 1: Start the Servers

**Terminal 1 - Backend:**
```bash
cd brenda-backend
npm run dev
```
Wait for: `🚀 Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd brenda
npm run dev
```
Wait for: `Local: http://localhost:3001/`

---

### Step 2: Login to Brenda Platform

1. Open your browser: `http://localhost:3001`
2. Click **"Login"** in the top navigation
3. Enter your credentials:
   - **Email:** `testuser@brenda.com`
   - **Password:** `Test@12345`
4. Click **"Sign In"**

---

### Step 3: Navigate to Automation Dashboard

**Option A: Direct URL**
```
http://localhost:3001/automation
```

**Option B: Navigation Menu**
1. Click on your profile/avatar in the top right
2. Select **"Automation"** from the dropdown menu
3. Or look for **"Automation Dashboard"** in the sidebar

---

### Step 4: Go to Smart Contracts Tab

Once on the Automation Dashboard:

1. You'll see several tabs at the top:
   - Overview
   - **Smart Contracts** ⬅️ Click this
   - Invoicing
   - Email Marketing
   - Lead Scoring
   - Follow-ups
   - Reminders
   - Status Updates

2. Click the **"Smart Contracts"** tab (green icon with a document)

---

### Step 5: Create a New Contract

On the Smart Contracts page, you'll see:

1. **Top Right Corner:** Click the green **"Generate Contract"** button
   - Icon: ➕ 
   - Text: "Generate Contract"

2. This will take you to: `http://localhost:3001/automation/contracts/new`

---

### Step 6: Fill in Contract Details

You'll see a form with the following fields:

#### Basic Information

**1. Title** (Required)
```
Example: "Website Development Agreement"
```

**2. Description** (Required)
```
Example: "Development of a responsive e-commerce website for XYZ Company"
```

**3. Related Job ID** (Optional)
```
If this contract relates to a posted job, enter the job ID
Example: cmhgq5mad0000ukkkva7zxqa1
```

**4. Client ID** (Required)
```
The user ID of the client
Example: cmhgqfpcv0000ukj0pniymbmb
```

**5. Freelancer ID** (Required)
```
Your freelancer user ID (or the freelancer working on this)
Example: cmhkgcley0000ukwoy27bjujv
```

**6. Template ID** (Optional)
```
If you have a pre-made template, enter its ID
Example: cmhkgeo0l0000uk80n0ro6rvj
Leave blank to use default template
```

**7. Expires At** (Optional)
```
When should this contract offer expire?
Example: 2025-11-11
```

---

#### Contract Terms

**8. Scope of Work / Description**
```
Example:
- Homepage design with hero section
- 5 product pages
- Contact form integration
- Mobile responsive design
- SEO optimization
```

**9. Payment Terms**
```
Example:
- Total: $5,000
- 50% ($2,500) upfront
- 50% ($2,500) upon completion
- Payment via PayPal or Bank Transfer
```

**10. Timeline**
```
Example:
- Duration: 6 weeks
- Start date: November 10, 2025
- Milestones:
  - Week 2: Design approval
  - Week 4: Frontend complete
  - Week 6: Final delivery
```

**11. Intellectual Property Rights**
```
Example:
All code and design work becomes the exclusive property 
of the Client upon receipt of final payment. Freelancer 
retains the right to showcase work in portfolio.
```

---

### Step 7: Preview & Submit

1. **Review all fields** - Make sure everything is correct
2. Click the green **"Generate Contract"** button at the bottom
3. Wait for processing (usually 1-2 seconds)

---

### Step 8: View Generated Contract

After generation:

1. **Success Message:** "Contract generated successfully"
2. You'll be redirected back to the **Automation Dashboard**
3. The new contract will appear in the **Smart Contracts** list

---

### Step 9: View Contract Details

In the contracts list, each contract shows:

- **Title** - Contract name
- **Description** - Brief description
- **Status** - DRAFT, PENDING, SIGNED, ACTIVE, COMPLETED
- **Client** - Client name
- **Freelancer** - Freelancer name
- **Version** - Contract version number

**Available Actions:**
- 🔵 **View** - See full contract details
- ✅ **Sign** - Digitally sign the contract

---

## 📋 Complete Example

Here's a filled example for a Web Development project:

### Basic Info
```
Title: E-Commerce Website Development
Description: Build a modern e-commerce platform with payment integration
Job ID: (leave blank or paste job ID)
Client ID: cmhgqfpcv0000ukj0pniymbmb
Freelancer ID: cmhkgcley0000ukwoy27bjujv
Template ID: (leave blank for default)
Expires At: 2025-11-15
```

### Terms
```
Scope of Work:
- Design and develop responsive e-commerce website
- Product catalog with search and filters
- Shopping cart and checkout system
- Stripe payment integration
- Admin dashboard for inventory management
- Mobile-friendly design
- SEO optimization
- SSL certificate setup

Payment Terms:
Total Amount: $8,000 USD
Payment Schedule:
- 30% ($2,400) upon signing
- 40% ($3,200) at beta launch
- 30% ($2,400) upon final delivery
Payment Method: Bank transfer or PayPal

Timeline:
Project Duration: 8 weeks
Start Date: November 10, 2025
Milestones:
- Week 1-2: Design mockups and approval
- Week 3-4: Frontend development
- Week 5-6: Backend and payment integration
- Week 7: Testing and bug fixes
- Week 8: Deployment and handover

Intellectual Property:
All source code, designs, and materials created for this 
project become the exclusive property of [Client Name] upon 
receipt of final payment. Freelancer retains the right to 
include this project in their portfolio with client permission.
```

---

## 🔄 Contract Workflow

### 1. Draft State
- Contract is created but not yet sent
- Can be edited or deleted
- Client cannot see it yet

### 2. Pending State
- Contract sent to client for review
- Client can accept or request changes

### 3. Signed State
- Both parties have signed
- Terms are now binding

### 4. Active State
- Work is in progress
- Contract terms are in effect

### 5. Completed State
- All deliverables submitted
- Final payment received
- Contract fulfilled

---

## 💡 Pro Tips

### Using Templates
1. **Create a template first** for contracts you use repeatedly
2. Navigate to Template Management (if available)
3. Create templates for:
   - Web Development
   - Mobile Apps
   - Design Services
   - Consulting
   - Writing/Content

### Variable Substitution
Templates support these variables:
- `{{title}}` - Project title
- `{{clientName}}` - Client's full name
- `{{freelancerName}}` - Your name
- `{{currentDate}}` - Today's date
- `{{description}}` - Project description
- `{{terms.payment}}` - Payment terms
- `{{terms.timeline}}` - Timeline
- `{{terms.scope}}` - Scope of work

### Quick Start
For your first contract:
1. ✅ Leave "Template ID" **blank** (uses default template)
2. ✅ Leave "Job ID" **blank** (create standalone contract)
3. ✅ Leave "Expires At" **blank** (never expires)
4. ✅ Fill only required fields (Title, Description, Client ID, Freelancer ID, Terms)

---

## 🎨 Visual Guide

### Dashboard Navigation
```
┌────────────────────────────────────────────┐
│  🏠 Home  |  💼 Jobs  |  🤖 Automation    │
└────────────────────────────────────────────┘
           Click "Automation" ↑
                    ↓
┌────────────────────────────────────────────┐
│  Automation Dashboard                      │
├────────────────────────────────────────────┤
│  ⚙️ Overview  |  📄 Smart Contracts  | ... │
└────────────────────────────────────────────┘
        Click "Smart Contracts" tab ↑
                    ↓
┌────────────────────────────────────────────┐
│  Smart Contracts                           │
│  ┌──────────────────────────┐              │
│  │ ➕ Generate Contract     │ ← Click this │
│  └──────────────────────────┘              │
└────────────────────────────────────────────┘
```

### Contract Form
```
┌─────────────────────────────────────────────────┐
│  Generate Smart Contract                        │
├─────────────────────────────────────────────────┤
│                                                 │
│  Title: [________________________]              │
│  Description: [_________________]               │
│  Job ID: [_____________________] (optional)     │
│  Client ID: [__________________]                │
│  Freelancer ID: [______________]                │
│  Template ID: [________________] (optional)     │
│  Expires At: [_________________] (optional)     │
│                                                 │
│  ═══ Contract Terms ═══                         │
│  Scope: [__________________________]            │
│  Payment: [________________________]            │
│  Timeline: [_______________________]            │
│  IP Rights: [______________________]            │
│                                                 │
│  ┌────────────────────┐                         │
│  │ Generate Contract  │                         │
│  └────────────────────┘                         │
└─────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting

### Issue: Can't find Automation Dashboard
**Solution:** 
- Check URL: `http://localhost:3001/automation`
- Make sure you're logged in
- Check if user type is FREELANCER or CLIENT (not ADMIN)

### Issue: "Generate Contract" button not working
**Solution:**
- Check browser console for errors (F12)
- Verify backend is running on port 5000
- Check network tab for failed API calls

### Issue: Form validation errors
**Solution:**
- Required fields: Title, Description, Client ID, Freelancer ID, Terms
- User IDs must be valid (copy from database or user list)
- Dates must be in YYYY-MM-DD format

### Issue: Contract not appearing in list
**Solution:**
- Refresh the page
- Check "All Contracts" or filter settings
- Verify contract was created (check backend logs)

### Issue: Don't know Client/Freelancer IDs
**Solution:**
Run this script to list users:
```bash
node check-users.js
```
Copy the ID from the output

---

## 🔗 API Endpoints Used

Behind the scenes, the frontend calls:

| Action | Endpoint | Method |
|--------|----------|--------|
| List Contracts | `/api/automation/smart-contracts` | GET |
| Create Contract | `/api/automation/smart-contracts/generate` | POST |
| Get Templates | `/api/automation/contract-templates` | GET |
| View Contract | `/api/automation/smart-contracts/:id` | GET |

---

## 📚 Next Steps

After creating your contract:

1. **Send to Client** - Share the contract link
2. **Request Signature** - Client reviews and signs
3. **Start Work** - Begin project when both parties sign
4. **Track Progress** - Update milestones as you complete them
5. **Complete Contract** - Mark as completed when delivered

---

## 🎓 Learn More

- **Templates:** Create reusable contract templates for faster generation
- **Variables:** Use variable substitution for dynamic content
- **E-Signatures:** Integrate digital signature providers (future feature)
- **PDF Export:** Download contracts as PDF (future feature)

---

**Need Help?**
- Check backend console for errors
- Verify all required fields are filled
- Ensure valid user IDs for client and freelancer
- Test with the sample data provided above

**Happy Contracting! 🎉**
