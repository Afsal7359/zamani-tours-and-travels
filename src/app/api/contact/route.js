import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    return NextResponse.json({ success: true, message: 'Message received successfully' });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
