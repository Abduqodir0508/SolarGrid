/**
 * SolarGrid Telegram Bot Polling Runner
 * Ishga tushirish: npm run bot
 */

import fs from 'fs';
import path from 'path';

// .env.local faylini yuklash
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length > 0) {
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    });
  }
} catch (e) {}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9272360178:AAFwtCPYDyLwsc7nHXPb0ZMf8x1YW8LKv_4';
const WEBHOOK_URL = process.env.LOCAL_WEBHOOK_URL || 'http://localhost:3000/api/telegram/webhook';

console.log('🤖 SolarGrid Telegram Bot Polling xizmati ishga tushmoqda...');
console.log(`Bot Token: ${BOT_TOKEN.slice(0, 10)}...`);

let offset = 0;

async function pollUpdates() {
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
