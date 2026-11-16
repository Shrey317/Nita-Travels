import Link from 'next/link';
import { prisma } from '@/lib/db/client';
import { notFound } from 'next/navigation';
import { requireSession } from '@/lib/api-response';
import { CarDetails } from '@/components/fleet-expansion/car-details';
import { MonthlyMileage } from '@/components/fleet-expansion/monthly-mileage';
export default async function CarPage({params}:{params:Promise<{id:string}>}) {
 const session=await requireSession();const {id}=await params;
 if (!await prisma.vehicleAssignment.findFirst({where:{vehicleId:id,module:'RENT_TO_OWN',endsAt:null}})) notFound();
 return <><Link className="underline" href="/rent-to-own/vehicles">Back to RTO cars</Link><h1 className="mt-4 text-2xl font-semibold">{id}</h1><CarDetails vehicleId={id} admin={session.staffRole==='ADMIN'} rto /><MonthlyMileage vehicleId={id} rto /></>;
}
