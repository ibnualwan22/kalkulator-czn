// src/app/api/initial-data/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Ini fungsi untuk menangani request GET
export async function GET() {
  try {
    // 1. Ambil Data Combatant beserta Kartu Bawaannya
    const combatants = await prisma.combatant.findMany({
      include: {
        cards: true, // Sertakan data kartu (Basic/Unique)
      },
    });

    // 2. Ambil Data Rules (Aturan Angka)
    const rules = await prisma.gameRule.findMany();

    // 3. Ambil Template Kartu Netral/Monster (yang tidak punya pemilik)
    const miscCards = await prisma.cardTemplate.findMany({
      where: {
        combatantId: null, // Ambil yang bukan milik Mika/Tressa
      },
    });

    // 4. Kembalikan paket data lengkap ke Frontend
    return NextResponse.json({
      success: true,
      data: {
        combatants,
        rules,
        miscCards,
      },
    });
    
  } catch (error) {
    console.error("Database Error:", error);
    return NextResponse.json({ success: false, error: "Gagal mengambil data" }, { status: 500 });
  }
}