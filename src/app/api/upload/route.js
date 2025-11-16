import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// 1. Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request) {
  try {
    // 2. Ambil file dari form data
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }

    // 3. Ubah file menjadi Buffer agar bisa dikirim lewat memori
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload ke Cloudinary (menggunakan Promise agar kita bisa menunggu hasilnya)
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "czn-calculator", // Nama folder di Cloudinary (bebas)
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    // 5. Kembalikan URL gambar yang ada di internet (secure_url)
    return NextResponse.json({ 
      success: true, 
      url: uploadResult.secure_url 
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload to Cloudinary failed." }, { status: 500 });
  }
}