import { saveCarDetails } from '@/lib/db/car-details';
import { addFollowUp, closeFollowUp, getFollowUps } from '@/lib/db/rto-follow-ups';
import { randomUUID } from 'node:crypto';
import { beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { createRtoVehicle } from '@/lib/db/rto-vehicles';
import { createAgreement, createDriver, changeAgreementStatus, getRtoAgreement, recordWeeklyPayment, recordRtoPayment, reverseRtoPayment } from '@/lib/db/rto';
import { rtoReport } from '@/lib/db/rto-report';
describe('weekly rent and deposit receipts', () => {
  let agreementId: string;
  beforeAll(async () => {
    await verifyTestEnvironment(true);
    await createRtoVehicle({ id:'RT88',make:'Suzuki',model:'S-Presso',registration:'DEPOSIT-TEST',transmission:'Manual',purchaseDate:'2025-01-01',purchasePrice:'100000',mileageAtPurchaseKm:0,currentMileageKm:0 },'admin');
    const driver = await createDriver({name:'Deposit test driver',phone:'000',licenceReference:'TEST'},'admin');
    agreementId = (await createAgreement({ number:'DEPOSIT-TEST',vehicleId:'RT88',driverId:driver.id,modelYear:2025,startDate:'2025-01-01',weeklyAmount:'2850' },'admin')).id;
    await prisma.rtoDocument.create({ data:{agreementId,title:'Test contract',kind:'SIGNED_CONTRACT',mimeType:'application/pdf',content:Buffer.from('%PDF-test'),actor:'admin'} });
  });
  const receipt = (amount: string, weeks = 1) => ({ agreementId, date:'2025-04-10', amount, weeks, reference:randomUUID(), method:'EFT', idempotencyKey:randomUUID() });
  it('starts without an upfront deposit and shows only the deposit due at cutoff', async () => {
    await changeAgreementStatus({agreementId,status:'ACTIVE',reason:'Signed agreement'},'admin');
    const a = await getRtoAgreement(agreementId); expect(a.nextPayment).toBe('3500.00'); expect(a.depositRemaining).toBe('8000.00');
    const report = await rtoReport({from:'2025-01-01',to:'2025-01-08'});
    expect(report.totalOutstanding).toBe('3500.00');
    expect(report.rows[0]?.paymentStatus).toBe('Due today');
    expect(report.rows[0]?.dueItems.map(item => item.amount)).toEqual(['2850.00', '650.00']);
    expect(report.rows[0]?.depositLeft).toBe('8000.00');
    const late = await rtoReport({from:'2025-01-01',to:'2025-01-09'});
    expect(late.rows[0]?.paymentStatus).toBe('Overdue');
    expect(late.rows[0]?.daysLate).toBe(1);
  });
  it('rejects a short payment atomically and records delayed weeks together', async () => {
    await expect(recordWeeklyPayment(receipt('2850'),'admin')).rejects.toThrow('3500.00');
    expect(await prisma.rtoPayment.count({where:{agreementId}})).toBe(0);
    const input = receipt('7000',2);
    const [a,b] = await Promise.all([recordWeeklyPayment(input,'admin'),recordWeeklyPayment(input,'admin')]);
    expect(a.id).toBe(b.id); expect(a.depositAmount.toFixed(2)).toBe('1300.00');
    expect((await getRtoAgreement(agreementId)).depositRemaining).toBe('6700.00');
    await reverseRtoPayment({paymentId:a.id,reason:'Wrong receipt'},'admin');
    expect((await getRtoAgreement(agreementId)).depositRemaining).toBe('8000.00');
  });
  it('caps the last deposit payment and then collects rent only', async () => {
    await recordWeeklyPayment(receipt('42000',12),'admin');
    expect((await getRtoAgreement(agreementId)).nextPayment).toBe('3050.00');
    await recordWeeklyPayment(receipt('3050'),'admin');
    const a = await getRtoAgreement(agreementId); expect(a.depositRemaining).toBe('0.00'); expect(a.nextPayment).toBe('2850.00');
    const payment = await recordWeeklyPayment(receipt('2850'),'admin'); expect(payment.depositAmount.isZero()).toBe(true);
    const report = await rtoReport({from:'2025-01-01',to:new Date().toISOString().slice(0,10)}); expect(report.collected).toBe('39900.00');
  });
  it('keeps existing upfront receipts when choosing the next weekly amount', async () => {
    const driver = await createDriver({name:'Old deposit',phone:'000',licenceReference:'OLD'},'admin');
    const a = await createAgreement({number:'OLD-DEPOSIT',vehicleId:'RT88',driverId:driver.id,modelYear:2025,startDate:'2025-01-01',weeklyAmount:'2850'},'admin');
    await recordRtoPayment({agreementId:a.id,date:'2025-01-01',amount:'8000',kind:'UPFRONT',reference:'OLD',method:'EFT',idempotencyKey:randomUUID()},'admin');
    expect((await getRtoAgreement(a.id)).upfrontReceived).toBe('8000.00');
    expect((await getRtoAgreement(a.id)).depositRemaining).toBe('0.00');
    await expect(recordRtoPayment({agreementId:a.id,date:'2025-01-02',amount:'650',kind:'UPFRONT',reference:'EXTRA',method:'EFT',idempotencyKey:randomUUID()},'admin')).rejects.toThrow('Only R0.00');
  });
  it('keeps reminders separate from balances and makes retries safe', async () => {
    const before = await getRtoAgreement(agreementId);
    const input = {agreementId,note:'Will pay Friday',dueDate:'2026-11-20',idempotencyKey:randomUUID()};
    const note = await addFollowUp(input,'admin');
    expect((await addFollowUp(input,'admin')).id).toBe(note.id);
    expect((await getFollowUps([agreementId])).filter(n => !n.done)).toHaveLength(1);
    await expect(closeFollowUp({agreementId,noteId:'another-drivers-note'},'admin')).rejects.toThrow('Follow-up not found');
    await closeFollowUp({agreementId,noteId:note.id},'admin');
    await closeFollowUp({agreementId,noteId:note.id},'admin');
    expect((await getFollowUps([agreementId]))[0]?.done).toBe(true);
    expect((await getRtoAgreement(agreementId)).scheduledBalance).toBe(before.scheduledBalance);
  });
  it('stores included operating costs without changing driver balances',async()=>{
    const before=await getRtoAgreement(agreementId);
    await saveCarDetails({vehicleId:'RT88',modelYear:2025,handlerName:'Manager A',purchaseCompany:'Test company',fidelityMonthly:'225'},'admin');
    const car=await prisma.vehicle.findUniqueOrThrow({where:{id:'RT88'}});
    expect(car.fidelityMonthlyCents).toBe(22500);expect(car.handlerName).toBe('Manager A');expect(car.modelYear).toBe(2025);
    expect((await getRtoAgreement(agreementId)).scheduledBalance).toBe(before.scheduledBalance);
    await expect(saveCarDetails({vehicleId:'RT88',modelYear:2025,handlerName:'Manager A',fidelityMonthly:'-10'},'admin')).rejects.toThrow();
  });
});
