import { z } from 'zod';
import { prisma, TRANSACTION_OPTIONS } from './client';
import { calendarDateSchema } from '../schemas/common.schema';
import { lockAgreement } from './rto';
import { ValidationError } from '../errors';

const noteSchema = z.object({ note: z.string().trim().min(1).max(1000), dueDate: calendarDateSchema });
export async function addFollowUp(input: unknown, actor: string) {
  const data = noteSchema.extend({ agreementId: z.string().min(1), idempotencyKey: z.string().uuid() }).parse(input);
  return prisma.$transaction(async tx => {
    await lockAgreement(tx, data.agreementId);
    const existing = await tx.fleetAuditEvent.findFirst({ where: { scope: 'RTO', recordId: data.agreementId, action: 'FOLLOW_UP_ADDED', detail: { path: ['key'], equals: data.idempotencyKey } } });
    if (existing) return existing;
    return tx.fleetAuditEvent.create({ data: { scope: 'RTO', recordId: data.agreementId, action: 'FOLLOW_UP_ADDED', actor, detail: { note: data.note, dueDate: data.dueDate.toISOString().slice(0,10), key: data.idempotencyKey } } });
  }, TRANSACTION_OPTIONS);
}
export async function closeFollowUp(input: unknown, actor: string) {
  const data = z.object({ agreementId: z.string().min(1), noteId: z.string().min(1) }).parse(input);
  return prisma.$transaction(async tx => {
    await lockAgreement(tx, data.agreementId);
    if (!await tx.fleetAuditEvent.findFirst({ where: { id: data.noteId, scope: 'RTO', recordId: data.agreementId, action: 'FOLLOW_UP_ADDED' } })) throw new ValidationError('Follow-up not found for this driver.');
    const previous = await tx.fleetAuditEvent.findFirst({ where: { scope: 'RTO', recordId: data.agreementId, action: 'FOLLOW_UP_DONE', detail: { path: ['noteId'], equals: data.noteId } } });
    if (previous) return previous;
    return tx.fleetAuditEvent.create({ data: { scope: 'RTO', recordId: data.agreementId, action: 'FOLLOW_UP_DONE', actor, detail: { noteId: data.noteId } } });
  }, TRANSACTION_OPTIONS);
}
export async function getFollowUps(agreementIds: string[]) {
  const events = await prisma.fleetAuditEvent.findMany({ where: { scope: 'RTO', recordId: { in: agreementIds }, action: { in: ['FOLLOW_UP_ADDED','FOLLOW_UP_DONE'] } }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] });
  const closed = new Set(events.filter(e => e.action === 'FOLLOW_UP_DONE').map(e => (e.detail as { noteId: string }).noteId));
  return events.filter(e => e.action === 'FOLLOW_UP_ADDED').flatMap(e => {
    const parsed = noteSchema.safeParse(e.detail);
    return parsed.success ? [{ id: e.id, agreementId: e.recordId, ...parsed.data, actor: e.actor, done: closed.has(e.id) }] : [];
  });
}
