import { NextResponse } from 'next/server';
import { handleTelegramUpdate } from '@/lib/telegramBotLogic';

export async function POST(request: Request) {
  try {
    const update = await request.json();
    // Update ni qayta ishlash
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('Telegram webhook xatosi:', err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'SolarGrid Telegram Bot Webhook API',
    timestamp: new Date().toISOString(),
  });
}
