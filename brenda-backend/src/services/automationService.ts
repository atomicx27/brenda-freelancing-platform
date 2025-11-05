import prisma from '../utils/prisma';
import { emitEvent } from './events';

/**
 * Automation Service
 * Handles automatic contract generation based on triggers
 */

/**
 * Auto-generate contract when proposal is accepted
 */
export const autoGenerateContractOnProposalAcceptance = async (proposalId: string) => {
  try {
    console.log(`[Automation] Triggered: Auto-generate contract for proposal ${proposalId}`);

    // Get proposal details
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        job: {
          include: {
            owner: true // Include job owner (client)
          }
        },
        author: true // Include proposal author (freelancer)
      }
    });

    if (!proposal || !proposal.job) {
      console.warn(`[Automation] Proposal ${proposalId} not found or missing job`);
      return;
    }

    // Check if contract already exists for this proposal
    const existingContract = await prisma.smartContract.findFirst({
      where: {
        jobId: proposal.jobId,
        freelancerId: proposal.authorId,
        status: { in: ['DRAFT', 'PENDING_REVIEW', 'SIGNED', 'ACTIVE'] }
      }
    });

    if (existingContract) {
      console.log(`[Automation] Contract already exists for this proposal, skipping`);
      return existingContract;
    }

    // Find appropriate template based on job category
    const template = await findTemplateForJob(proposal.job);

    // Generate contract content
    const contractContent = generateContractFromProposal(proposal, template);

    // Create the contract
    const contract = await prisma.smartContract.create({
      data: {
        title: `${proposal.job.title} - Service Agreement`,
        description: `Automatically generated contract for ${proposal.job.title}`,
        content: contractContent,
        jobId: proposal.job.id,
        clientId: proposal.job.ownerId,
        freelancerId: proposal.authorId,
        templateId: template?.id || null,
        status: 'PENDING_REVIEW',
        version: '1.0',
        terms: {
          description: proposal.coverLetter || proposal.job.description,
          payment: `Total Budget: $${proposal.proposedRate || proposal.job.budget || 0}\nPayment upon milestone completion`,
          timeline: `Estimated ${proposal.estimatedDuration || proposal.job.duration || 'as agreed'} timeline`,
          deliverables: proposal.job.description,
          ip: 'All work becomes client property upon full payment',
          termination: 'Either party may terminate with 7 days notice'
        },
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      }
    });

    // Emit event for notifications
    emitEvent('CONTRACT_AUTO_GENERATED', {
      contractId: contract.id,
      jobId: proposal.job.id,
      clientId: proposal.job.ownerId,
      freelancerId: proposal.authorId,
      proposalId: proposal.id,
      reason: 'PROPOSAL_ACCEPTED'
    });

    console.log(`[Automation] ✅ Contract ${contract.id} auto-generated for proposal ${proposalId}`);

    return contract;
  } catch (error: any) {
    console.error(`[Automation] Failed to auto-generate contract:`, error.message);
    throw error;
  }
};

/**
 * Find best matching template for a job
 */
const findTemplateForJob = async (job: any) => {
  try {
    // Try to find template by category
    const categoryMap: Record<string, string> = {
      'WEB_DEVELOPMENT': 'WEB_DEVELOPMENT',
      'MOBILE_DEVELOPMENT': 'MOBILE_DEVELOPMENT',
      'DESIGN': 'DESIGN',
      'WRITING': 'WRITING',
      'MARKETING': 'MARKETING'
    };

    const templateCategory = categoryMap[job.category] || 'SERVICE';

    const template = await prisma.contractTemplate.findFirst({
      where: {
        category: templateCategory,
        isActive: true,
        isPublic: true
      },
      orderBy: { usageCount: 'desc' }
    });

    if (template) {
      // Increment usage count
      await prisma.contractTemplate.update({
        where: { id: template.id },
        data: { usageCount: { increment: 1 } }
      });
    }

    return template;
  } catch (error) {
    console.warn('[Automation] Could not find template, using default');
    return null;
  }
};

/**
 * Generate contract content from proposal and template
 */
const generateContractFromProposal = (proposal: any, template: any): string => {
  const job = proposal.job;
  const client = job.owner; // Job owner is the client
  const freelancer = proposal.author; // Proposal author is the freelancer

  const baseContent = template?.content || getDefaultContractTemplate();

  // Variable substitution
  let content = baseContent
    .replace(/{{title}}/g, job.title)
    .replace(/{{currentDate}}/g, new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }))
    .replace(/{{clientName}}/g, `${client.firstName} ${client.lastName}`)
    .replace(/{{clientEmail}}/g, client.email)
    .replace(/{{freelancerName}}/g, `${freelancer.firstName} ${freelancer.lastName}`)
    .replace(/{{freelancerEmail}}/g, freelancer.email)
    .replace(/{{description}}/g, job.description)
    .replace(/{{budget}}/g, `$${proposal.proposedRate || job.budget || 0}`)
    .replace(/{{timeline}}/g, proposal.estimatedDuration || job.duration || 'As agreed')
    .replace(/{{jobId}}/g, job.id)
    .replace(/{{proposalId}}/g, proposal.id);

  return content;
};

/**
 * Default contract template
 */
const getDefaultContractTemplate = (): string => {
  return `# {{title}} - Service Agreement

**Effective Date:** {{currentDate}}

This Service Agreement ("Agreement") is entered into between:

**CLIENT:**
- Name: {{clientName}}
- Email: {{clientEmail}}

**FREELANCER:**
- Name: {{freelancerName}}
- Email: {{freelancerEmail}}

## 1. Project Description

{{description}}

## 2. Scope of Work

The Freelancer agrees to provide the services outlined in the project description and deliver the agreed-upon deliverables.

## 3. Compensation

**Total Project Budget:** {{budget}}

Payment will be made according to the following schedule:
- 50% upon project commencement
- 50% upon successful completion and delivery

## 4. Timeline

**Estimated Duration:** {{timeline}}

The Freelancer will make reasonable efforts to complete the project within the estimated timeline, subject to timely feedback and approvals from the Client.

## 5. Intellectual Property Rights

Upon receipt of full payment, all work products, including but not limited to source code, designs, and documentation, shall become the exclusive property of the Client.

The Freelancer may include this project in their portfolio with the Client's permission.

## 6. Confidentiality

Both parties agree to keep all project information, trade secrets, and business details confidential and not disclose them to third parties without prior written consent.

## 7. Termination

Either party may terminate this Agreement with seven (7) days written notice. The Client agrees to pay for all work completed up to the termination date.

## 8. Dispute Resolution

Any disputes arising from this Agreement shall first be attempted to be resolved through good faith negotiation. If unresolved, disputes may be escalated to mediation or arbitration.

## 9. Governing Law

This Agreement shall be governed by the laws of the applicable jurisdiction.

---

**Reference:**
- Job ID: {{jobId}}
- Proposal ID: {{proposalId}}

**Signatures:**

**CLIENT:** ___________________________  Date: __________

**FREELANCER:** _______________________  Date: __________

---

*This contract was automatically generated by the Brenda Platform.*
`;
};

/**
 * Auto-generate invoice when contract is signed
 */
export const autoGenerateInvoiceOnContractSigned = async (contractId: string) => {
  try {
    console.log(`[Automation] Triggered: Auto-generate invoice for contract ${contractId}`);

    const contract = await prisma.smartContract.findUnique({
      where: { id: contractId },
      include: {
        job: true,
        client: true,
        freelancer: true
      }
    });

    if (!contract) {
      console.warn(`[Automation] Contract ${contractId} not found`);
      return;
    }

    // Extract budget from terms
    const budget = extractBudgetFromTerms(contract.terms);

    if (!budget) {
      console.warn(`[Automation] Could not extract budget from contract terms`);
      return;
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Create first invoice (50% upfront)
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        contractId: contract.id,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId,
        jobId: contract.jobId,
        title: `${contract.title} - Initial Payment`,
        description: 'First installment (50% upfront payment)',
        items: [
          {
            description: 'Project Commencement Payment',
            quantity: 1,
            unitPrice: budget * 0.5,
            total: budget * 0.5
          }
        ] as any,
        subtotal: budget * 0.5,
        taxRate: 0,
        taxAmount: 0,
        total: budget * 0.5,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        status: 'SENT'
      }
    });

    emitEvent('INVOICE_AUTO_GENERATED', {
      invoiceId: invoice.id,
      contractId: contract.id,
      clientId: contract.clientId,
      freelancerId: contract.freelancerId,
      amount: invoice.total,
      reason: 'CONTRACT_SIGNED'
    });

    console.log(`[Automation] ✅ Invoice ${invoice.invoiceNumber} auto-generated`);

    return invoice;
  } catch (error: any) {
    console.error(`[Automation] Failed to auto-generate invoice:`, error.message);
    throw error;
  }
};

/**
 * Extract budget from contract terms
 */
const extractBudgetFromTerms = (terms: any): number | null => {
  try {
    if (typeof terms === 'string') {
      terms = JSON.parse(terms);
    }

    // Try to extract from payment field
    const paymentText = terms.payment || '';
    const match = paymentText.match(/\$?(\d+(?:,\d{3})*(?:\.\d{2})?)/);

    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }

    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Generate unique invoice number
 */
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');

  const count = await prisma.invoice.count({
    where: {
      invoiceNumber: {
        startsWith: `INV-${year}${month}`
      }
    }
  });

  const sequence = String(count + 1).padStart(4, '0');
  return `INV-${year}${month}-${sequence}`;
};

/**
 * Auto-send follow-up email when contract expires without signature
 */
export const autoFollowUpExpiredContracts = async () => {
  try {
    console.log('[Automation] Checking for expired unsigned contracts...');

    const expiredContracts = await prisma.smartContract.findMany({
      where: {
        status: 'PENDING_REVIEW',
        expiresAt: {
          lte: new Date()
        }
      },
      include: {
        client: true,
        freelancer: true,
        job: true
      }
    });

    for (const contract of expiredContracts) {
      // Mark as expired
      await prisma.smartContract.update({
        where: { id: contract.id },
        data: { status: 'EXPIRED' }
      });

      // Emit event for notification
      emitEvent('CONTRACT_EXPIRED', {
        contractId: contract.id,
        jobId: contract.jobId,
        clientId: contract.clientId,
        freelancerId: contract.freelancerId
      });

      console.log(`[Automation] Contract ${contract.id} marked as expired`);
    }

    console.log(`[Automation] ✅ Processed ${expiredContracts.length} expired contracts`);

    return expiredContracts.length;
  } catch (error: any) {
    console.error('[Automation] Failed to process expired contracts:', error.message);
    throw error;
  }
};

export default {
  autoGenerateContractOnProposalAcceptance,
  autoGenerateInvoiceOnContractSigned,
  autoFollowUpExpiredContracts
};
