import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { handleApiError } from '@/lib/api-response';
import { staffRegistrationSchema, ownerEmail } from '@/lib/staff-registration';
import { checkLoginRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const limit = await checkLoginRateLimit(`registration:${getClientIp(request)}`);
    if (!limit.allowed) return NextResponse.json({ error: 'Too many attempts. Please try again later.' }, { status: 429 });
    const input = staffRegistrationSchema.parse(await request.json());
    const passwordHash = await bcrypt.hash(input.password, 12);
    // Never allow public registration to claim the owner's recovery identity.
    if (input.email !== ownerEmail) {
      await prisma.staffAccount.upsert({ where: { email: input.email }, update: {}, create: {
        email: input.email, name: input.name, passwordHash,
      } });
    }
    return NextResponse.json({ message: 'Your request has been received. An administrator must approve access before you can sign in.' });
  } catch (error) { return handleApiError(error); }
}
