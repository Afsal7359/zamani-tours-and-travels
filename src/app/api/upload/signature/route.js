import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function GET() {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = 'zamani';
    const params = { folder, timestamp };
    const stringToSign =
      Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&') + apiSecret;
    const signature = crypto.createHash('sha256').update(stringToSign).digest('hex');

    return NextResponse.json({
      cloudName,
      apiKey,
      timestamp,
      signature,
      folder,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
