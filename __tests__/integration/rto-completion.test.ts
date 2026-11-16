import { randomUUID } from 'node:crypto';
import { beforeAll, expect, it } from 'vitest';
import { prisma } from '@/lib/db/client';
import { verifyTestEnvironment } from '@/lib/db/safety';
import { createRtoVehicle } from '@/lib/db/rto-vehicles';
import { createDriver,createAgreement,changeAgreementStatus,recordRtoPayment,reverseRtoPayment } from '@/lib/db/rto';
let agreementId:string;
beforeAll(async()=>{
  await verifyTestEnvironment(true);
  await createRtoVehicle({id:'RT87',make:'Suzuki',model:'S-Presso',registration:'FINISH-TEST',transmission:'Manual',purchaseDate:'2025-01-01',purchasePrice:'100000',mileageAtPurchaseKm:0,currentMileageKm:0},'admin');
  const driver=await createDriver({name:'Completion test',phone:'000',licenceReference:'TEST'},'admin');
  const a=await createAgreement({number:'FINISH-TEST',vehicleId:'RT87',driverId:driver.id,modelYear:2025,startDate:'2025-01-01',weeklyAmount:'100',weeks:1,upfrontRequired:'0'},'admin');agreementId=a.id;
});
it('requires the signed file and paid balance, and prevents closing over unused credit',async()=>{
  await expect(changeAgreementStatus({agreementId,status:'ACTIVE',reason:'Test'},'admin')).rejects.toThrow('signed contract');
  await prisma.rtoDocument.create({data:{agreementId,title:'Signed test',kind:'SIGNED_CONTRACT',mimeType:'application/pdf',content:Buffer.from('%PDF-test'),actor:'admin'}});
  await changeAgreementStatus({agreementId,status:'ACTIVE',reason:'Signed'},'admin');
  await expect(changeAgreementStatus({agreementId,status:'COMPLETED',reason:'Review'},'admin')).rejects.toThrow('all obligations');
  const input={agreementId,date:'2025-01-08',amount:'110',kind:'RENT',reference:'FINAL',method:'EFT',idempotencyKey:randomUUID()};
  const overpaid=await recordRtoPayment(input,'admin');
  await expect(changeAgreementStatus({agreementId,status:'COMPLETED',reason:'Review'},'admin')).rejects.toThrow('unused payment credit');
  await reverseRtoPayment({paymentId:overpaid.id,reason:'Correct over-entry'},'admin');
  const paid=await recordRtoPayment({...input,amount:'100',reference:'FINAL-CORRECTED',idempotencyKey:randomUUID()},'admin');
  const completed=await changeAgreementStatus({agreementId,status:'COMPLETED',reason:'Final balance and paperwork checked'},'admin');
  expect(completed.status).toBe('COMPLETED');
  await expect(reverseRtoPayment({paymentId:paid.id,reason:'Try after closure'},'admin')).rejects.toThrow('reviewed correction');
});
