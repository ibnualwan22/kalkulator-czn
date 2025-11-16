// src/app/api/upload/route.js
import { NextResponse } from "next/server";
import path from "path";
import { writeFile } from "fs/promises";

export async function POST(request) {
  try {
    // 1. Terima data file dari Frontend
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // 2. Ubah file menjadi Buffer (agar bisa disimpan)
    const buffer = Buffer.from(await file.arrayBuffer());

    // 3. Buat nama file unik (agar tidak bentrok)
    // Contoh: image_123456789.png
    const filename = file.name.replaceAll(" ", "_");
    const uniqueName = Date.now() + "_" + filename;

    // 4. Simpan ke folder public/uploads
    // Note: process.cwd() adalah folder root project
    const filePath = path.join(process.cwd(), "public/uploads", uniqueName);
    await writeFile(filePath, buffer);

    // 5. Kembalikan Alamat URL gambarnya
    return NextResponse.json({ 
      success: true, 
      url: `/uploads/${uniqueName}` 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}