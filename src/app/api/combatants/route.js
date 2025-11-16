import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Tambah Combatant Baru
export async function POST(request) {
  try {
    const body = await request.json();
    const newCombatant = await prisma.combatant.create({
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
      },
    });
    return NextResponse.json({ success: true, data: newCombatant });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal tambah combatant" }, { status: 500 });
  }
}

// DELETE: Hapus Combatant (Hati-hati, kartu miliknya akan ikut terhapus atau jadi yatim)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    // Hapus kartu miliknya dulu (Opsional, atau set null)
    await prisma.cardTemplate.deleteMany({
        where: { combatantId: parseInt(id) }
    });

    // Hapus Orangnya
    await prisma.combatant.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal hapus" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    
    const updated = await prisma.combatant.update({
      where: { id: parseInt(body.id) },
      data: {
        name: body.name,
        imageUrl: body.imageUrl,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal update combatant" }, { status: 500 });
  }
}