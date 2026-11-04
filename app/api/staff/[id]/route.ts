export const dynamic = "force-dynamic";

import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/client";
import { requireAdmin, handleApiError } from "@/lib/api-response";
import { NotFoundError, ValidationError } from "@/lib/errors";
import { adminUpdateStaffSchema } from "@/lib/staff-registration";

const SAFE_STAFF_SELECT = {
  id: true,
  name: true,
  email: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function PATCH(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const input = adminUpdateStaffSchema.parse(await request.json());

    if (!input.name && !input.status && !input.password) {
      throw new ValidationError("Provide at least one field to update.");
    }

    const existing = await prisma.staffAccount.findUnique({
      where: { id: params.id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundError("User account not found.");
    }

    const shouldRevokeSessions =
      Boolean(input.password) ||
      (input.status !== undefined && input.status !== "ACTIVE" && existing.status === "ACTIVE");

    const data: {
      name?: string;
      status?: string;
      passwordHash?: string;
      sessionVersion?: { increment: number };
    } = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.status !== undefined) data.status = input.status;
    if (input.password !== undefined) {
      data.passwordHash = await bcrypt.hash(input.password, 12);
    }
    if (shouldRevokeSessions) {
      data.sessionVersion = { increment: 1 };
    }

    const account = await prisma.staffAccount.update({
      where: { id: params.id },
      data,
      select: SAFE_STAFF_SELECT,
    });

    return NextResponse.json({ account });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdmin();
    const existing = await prisma.staffAccount.findUnique({
      where: { id: params.id },
      select: { id: true },
    });
    if (!existing) {
      throw new NotFoundError("User account not found.");
    }

    await prisma.staffAccount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

