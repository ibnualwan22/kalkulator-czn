// src/app/api/cards/route.js
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// CREATE (Menambah Kartu Baru)
export async function POST(request) {
  try {
    const body = await request.json();
    
    // body isinya: { name, type, imageUrl, description, combatantId (opsional) }

    const newCard = await prisma.cardTemplate.create({
      data: {
        name: body.name,
        type: body.type, // Basic, Unique, Neutral, Monster
        imageUrl: body.imageUrl,
        description: body.description,
        cost: parseInt(body.cost || 0), // Cost visual di kartu
        tags: body.tags,
        // Jika ada combatantId, sambungkan. Jika tidak, biarkan null (Neutral/Monster)
        combatantId: body.combatantId ? parseInt(body.combatantId) : null,
      },
    });

    return NextResponse.json({ success: true, data: newCard });

  } catch (error) {
    console.error("Create Card Error:", error);
    return NextResponse.json({ success: false, error: "Gagal menyimpan kartu" }, { status: 500 });
  }
}

// GET (Mengambil Daftar Semua Kartu untuk Admin)
export async function GET() {
    const cards = await prisma.cardTemplate.findMany({
        orderBy: { id: 'desc' }, // Yang terbaru di atas
        include: { combatant: true } // Sertakan nama pemiliknya
    });
    return NextResponse.json({ success: true, data: cards });
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, ...data } = body; // Pisahkan ID dari data lainnya

    const updatedCard = await prisma.cardTemplate.update({
      where: { id: parseInt(id) },
      data: {
        name: data.name,
        type: data.type,
        imageUrl: data.imageUrl,
        description: data.description,
        cost: parseInt(data.cost || 0),
        combatantId: data.combatantId ? parseInt(data.combatantId) : null,
      },
    });
    return NextResponse.json({ success: true, data: updatedCard });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal update kartu" }, { status: 500 });
  }
}

// DELETE (Hapus Kartu)
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    await prisma.cardTemplate.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal hapus kartu" }, { status: 500 });
  }
}