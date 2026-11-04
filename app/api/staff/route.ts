export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { ensureStaffAccountTable, prisma } from "@/lib/db/client";
import { requireAdmin, handleApiError } from "@/lib/api-response";
import { ConflictError } from "@/lib/errors";
import { adminCreateStaffSchema, ownerEmail } from "@/lib/staff-registration";

const SAFE_STAFF_SELECT = {
  id: true,
  name: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  try {
    await requireAdmin();
    await ensureStaffAccountTable();
    const accounts = await prisma.staffAccount.findMany({
      orderBy: { createdAt: "desc" },
      select: SAFE_STAFF_SELECT,
    });
    return NextResponse.json({ accounts });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    await ensureStaffAccountTable();
    const input = adminCreateStaffSchema.parse(await request.json());

    const reservedAdminUsername = (process.env.ADMIN_USERNAME ?? "admin").trim().toLowerCase();
    if (input.email === ownerEmail || input.email === reservedAdminUsername) {
      throw new ConflictError("That username or email is reserved for the administrator account.");
    }

    const existing = await prisma.staffAccount.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictError("A user account with this email or username already exists.");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const account = await prisma.staffAccount.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        status: "ACTIVE",
      },
      select: SAFE_STAFF_SELECT,
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
