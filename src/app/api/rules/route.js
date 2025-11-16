import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT: Update Nilai Rule
export async function PUT(request) {
  try {
    const body = await request.json(); 
    // body: { id: 1, value: 25 }

    const updatedRule = await prisma.gameRule.update({
      where: { id: body.id },
      data: { value: parseInt(body.value) },
    });

    return NextResponse.json({ success: true, data: updatedRule });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal update rule" }, { status: 500 });
  }
}