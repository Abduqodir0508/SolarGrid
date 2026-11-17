/**
 * SolarGrid Telegram Bot Polling Runner
 * Ishga tushirish: node scripts/telegram-bot.mjs
 */

import https from 'https';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7744883399:AAH1qXExampleTokenPlaceholder';
const WEBHOOK_URL = process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3000/api/telegram/webhook';

console.log('🤖 SolarGrid Telegram Bot Polling xizmati ishga tushmoqda...');
console.log(`Bot Token: ${BOT_TOKEN.slice(0, 10)}...`);

let offset = 0;

async function pollUpdates() {
  if (!BOT_TOKEN || BOT_TOKEN.includes('ExampleTokenPlaceholder')) {
    console.log('⚠️ TELEGRAM_BOT_TOKEN kiritilmagan. .env.local faylida TELEGRAM_BOT_TOKEN ni o\'rnating.');
    return;
  }

  const url = `https://api.telegram.org/bot${BOT_TOKEN}/getUpdates?offset=${offset}&timeout=30`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.ok && Array.isArray(data.result)) {
      for (const update of data.result) {
        offset = update.update_id + 1;
        // Webhook endpointga yuborish
        try {
          await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(update),
          });
        } catch (postErr) {
          console.error('Webhookga yuborishda xatolik:', postErr.message);
        }
      }
    }
  } catch (err) {
    console.error('Polling xatosi:', err.message);
    await new Promise((r) => setTimeout(r, 3000));
  }

  setImmediate(pollUpdates);
}

pollUpdates();
