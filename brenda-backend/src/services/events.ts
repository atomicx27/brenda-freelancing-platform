import { EventEmitter } from 'events';
import prisma from '../utils/prisma';
import { executeAutomationActions } from '../controllers/automationController';

// Lightweight in-process event bus
const eventBus = new EventEmitter();
eventBus.setMaxListeners(100); // Allow many listeners

// Retry helper
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === maxRetries) throw err;
      await new Promise(res => setTimeout(res, 500 * attempt));
    }
  }
  throw new Error('unreachable');
};

// Check if rule conditions match the event payload
const evaluateConditions = (conditions: any, event: any): boolean => {
  if (!conditions || typeof conditions !== 'object') return true;
  
  // Simple key-value matching for now
  for (const key of Object.keys(conditions)) {
    if (key === 'intervalMinutes') continue; // Skip scheduling metadata
    const expected = conditions[key];
    const actual = event[key];
    
    if (typeof expected === 'object' && expected !== null) {
      // Support operators like { $gte: 100 }, { $eq: "ACTIVE" }
      if (expected.$eq !== undefined && actual !== expected.$eq) return false;
      if (expected.$ne !== undefined && actual === expected.$ne) return false;
      if (expected.$gt !== undefined && !(actual > expected.$gt)) return false;
      if (expected.$gte !== undefined && !(actual >= expected.$gte)) return false;
      if (expected.$lt !== undefined && !(actual < expected.$lt)) return false;
      if (expected.$lte !== undefined && !(actual <= expected.$lte)) return false;
      if (expected.$in !== undefined && !expected.$in.includes(actual)) return false;
    } else {
      // Simple equality
      if (actual !== expected) return false;
    }
  }
  return true;
};

// Handle event by finding and running matching EVENT_BASED rules
async function handleEvent(eventType: string, payload: any) {
  try {
    const rules = await withRetry(() =>
      prisma.automationRule.findMany({
        where: {
          trigger: 'EVENT_BASED' as any,
          isActive: true,
          // Match by eventType in conditions if present
          OR: [
            { conditions: { path: ['eventType'], equals: eventType } },
            { conditions: { path: ['eventType'], not: { equals: null } } }
          ]
        }
      })
    );

    for (const rule of rules) {
      // Check if conditions match
      const ruleConditions = (rule.conditions as any) || {};
      if (ruleConditions.eventType && ruleConditions.eventType !== eventType) continue;
      if (!evaluateConditions(ruleConditions, payload)) continue;

      // Execute the rule
      const start = Date.now();
      let status: any = 'SUCCESS';
      let message = 'Event-based automation executed successfully';
      let error: string | null = null;

      try {
        await executeAutomationActions(rule, { event: payload });
        await withRetry(() =>
          prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              lastRun: new Date(),
              runCount: { increment: 1 },
              successCount: { increment: 1 }
            }
          })
        );
      } catch (e: any) {
        status = 'FAILED';
        message = 'Event-based automation execution failed';
        error = e?.message || 'Unknown error';
        await withRetry(() =>
          prisma.automationRule.update({
            where: { id: rule.id },
            data: {
              lastRun: new Date(),
              runCount: { increment: 1 },
              errorCount: { increment: 1 }
            }
          })
        );
      }

      const duration = Date.now() - start;
      await withRetry(() =>
        prisma.automationLog.create({
          data: {
            ruleId: rule.id,
            userId: rule.userId,
            status,
            message,
            error,
            data: payload,
            duration
          }
        })
      );
    }
  } catch (err) {
    console.error(`Event handler error for ${eventType}:`, err);
  }
}

// Register event handlers
eventBus.on('JOB_CREATED', (payload) => handleEvent('JOB_CREATED', payload));
eventBus.on('JOB_UPDATED', (payload) => handleEvent('JOB_UPDATED', payload));
eventBus.on('PROPOSAL_SUBMITTED', (payload) => handleEvent('PROPOSAL_SUBMITTED', payload));
eventBus.on('PROPOSAL_ACCEPTED', (payload) => handleEvent('PROPOSAL_ACCEPTED', payload));
eventBus.on('CONTRACT_GENERATED', (payload) => handleEvent('CONTRACT_GENERATED', payload));
eventBus.on('CONTRACT_SIGNED', (payload) => handleEvent('CONTRACT_SIGNED', payload));
eventBus.on('INVOICE_CREATED', (payload) => handleEvent('INVOICE_CREATED', payload));
eventBus.on('INVOICE_PAID', (payload) => handleEvent('INVOICE_PAID', payload));
eventBus.on('PAYMENT_RECEIVED', (payload) => handleEvent('PAYMENT_RECEIVED', payload));
eventBus.on('DEADLINE_APPROACHING', (payload) => handleEvent('DEADLINE_APPROACHING', payload));
eventBus.on('USER_REGISTERED', (payload) => handleEvent('USER_REGISTERED', payload));
eventBus.on('MESSAGE_RECEIVED', (payload) => handleEvent('MESSAGE_RECEIVED', payload));

// Emit an event
export function emitEvent(eventType: string, payload: any) {
  try {
    eventBus.emit(eventType, payload);
  } catch (err) {
    console.error(`Failed to emit event ${eventType}:`, err);
  }
}

export default { emitEvent };
