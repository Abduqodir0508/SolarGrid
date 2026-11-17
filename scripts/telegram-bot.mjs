/**
 * SolarGrid Standalone Telegram Bot Runner
 * Ishga tushirish: node scripts/telegram-bot.mjs
 */

import fs from 'fs';
import path from 'path';

// .env.local faylidan kalitlarni o'qish
const env = {};
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [k, ...v] = trimmed.split('=');
        if (k && v.length > 0) {
          env[k.trim()] = v.join('=').trim();
          process.env[k.trim()] = v.join('=').trim();
        }
      }
    }
  }
} catch (e) {}

const BOT_TOKEN = env.TELEGRAM_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '9272360178:AAFwtCPYDyLwsc7nHXPb0ZMf8x1YW8LKv_4';
const ADMIN_CHAT_ID = env.TELEGRAM_ADMIN_CHAT_ID || process.env.TELEGRAM_ADMIN_CHAT_ID || '2067464475';
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL || 'https://rcurwgkxpiivcfasahfh.supabase.co';
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export const PAYMENT_CARD = '5614 6887 1438 0671';
export const PAYMENT_CARD_HOLDER = 'M.S (Uzcard)';
export const PAYMENT_AMOUNT = '49,000 UZS';

// Telegram API chaqiruvlari
async function tgCall(method, payload) {
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API xatosi (${method}):`, err.message);
    return null;
  }
}

async function sendMessage(chatId, text, replyMarkup) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function sendPhoto(chatId, photoFileId, caption, replyMarkup) {
  return tgCall('sendPhoto', {
    chat_id: chatId,
    photo: photoFileId,
    caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

async function answerCallbackQuery(callbackQueryId, text) {
  return tgCall('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}

async function editMessageText(chatId, messageId, text, replyMarkup) {
  return tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

// Supabase orqali foydalanuvchi qidirish
async function findUserInSupabase(term) {
  try {
    const cleanTerm = term.trim().toLowerCase();
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=100`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const data = await res.json();
    if (!data || !Array.isArray(data.users)) return null;

    const matched = data.users.find(
      (u) =>
        u.email?.toLowerCase() === cleanTerm ||
        u.id.toLowerCase() === cleanTerm ||
        (cleanTerm.includes('@') && u.email?.toLowerCase().includes(cleanTerm))
    );

    if (!matched) return null;

    return {
      id: matched.id,
      email: matched.email || '',
      fullName: matched.user_metadata?.full_name || 'Foydalanuvchi',
      isPro: !!matched.user_metadata?.is_pro,
    };
  } catch (err) {
    console.error('Supabase qidiruv xatosi:', err.message);
    return null;
  }
}

// Supabase da PRO status berish
async function setProStatusInSupabase(userId, isPro) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 kun

    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_metadata: {
          is_pro: isPro,
          pro_activated_at: new Date().toISOString(),
          pro_expires_at: isPro ? expiresAt.toISOString() : null,
          payment_verified_via: 'telegram_bot',
        },
      }),
    });
    return res.ok;
  } catch (err) {
    console.error('PRO yangilash xatosi:', err.message);
    return false;
  }
}

// Matnlar
const TEXTS = {
  uz: {
    welcome: `☀️ <b>SolarGrid Rasmiy Botiga Xush Kelibsiz!</b>\n\nIltimos, qulay muloqot tilini tanlang:\nПожалуйста, выберите язык:\nPlease select a language:`,
    langSelected: `🇺🇿 <b>O'zbek tili tanlandi.</b>\n\nSolarGrid PRO versiyasini faollashtirish uchun saytimizdagi akkauntingiz (email yoki ID)ni kiriting:`,
    enterEmail: `✍️ Iltimos, <b>solargrid.uz</b> saytida ro'yxatdan o'tgan <b>elektron pochtangizni (Email)</b> yozib yuboring:`,
    notFound: (term) =>
      `⚠️ <b>Bunday akkaunt topilmadi!</b>\n\nSiz kiritgan "<code>${term}</code>" bo'yicha foydalanuvchi mavjud emas.\n\nIltimos, avval <a href="https://solargrid.uz">solargrid.uz</a> saytida ro'yxatdan o'ting, so'ng qayta urinib ko'ring yoki to'g'ri emailni qaytadan yozing.`,
    confirmAccount: (name, email, isPro) =>
      `🔍 <b>Akkaunt topildi! Ushbu hisob siznikimi?</b>\n\n👤 <b>Ism:</b> ${name}\n📧 <b>Email:</b> <code>${email}</code>\n⭐️ <b>Hozirgi status:</b> ${
        isPro ? '✅ PRO Faol' : 'Standart (Tekin)'
      }\n\nAgar ma'lumotlar to'g'ri bo'lsa, quyidagi tugmani bosing:`,
    btnConfirm: `✅ Ha, bu mening akkauntim`,
    btnChangeAccount: `🔄 Boshqa email kiritish`,
    paymentInfo: `💳 <b>SolarGrid PRO — To'lov ma'lumotlari</b>\n\n` +
      `⭐️ <b>PRO imkoniyatlar:</b> Cheksiz loyihalar, AI Avto-terish, PDF smeta va montaj chizmasi eksporti.\n\n` +
      `💰 <b>Summa:</b> <code>${PAYMENT_AMOUNT}</code> (1 oylik obuna)\n` +
      `💳 <b>Karta raqami:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Karta egasi:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Ko'rsatma:</b>\n` +
      `1. Yuqoridagi Uzcard kartasiga <b>${PAYMENT_AMOUNT}</b> o'tkazing.\n` +
      `2. To'lov amalga oshirilganligi haqidagi <b>chekni (skrinshot yoki rasmini)</b> ushbu botga rasm holatida yuboring.\n\n` +
      `Chek kelishi bilanoq adminlarimiz tekshirib, profilingizni PRO ga o'tkazadilar! 🚀`,
    receiptReceived: `✅ <b>To'lov cheki qabul qilindi!</b>\n\nChekingiz tekshirish uchun ma'muriyatga (admin) yuborildi. Bir necha daqiqada to'lov tasdiqlanib, saytda PRO status yoqiladi.\n\nBiz bilan ekanligingizdan mamnunmiz! ☀️`,
    proApprovedUser: `🎉 <b>TABRIKLAYMIZ! PRO VERSIYA FAOLLASHTIRILDI!</b>\n\nSizning to'lovingiz muvaffaqiyatli tasdiqlandi. SolarGrid akkauntingizda barcha PRO imkoniyatlar (AI terish, cheksiz papkalar, PDF smeta) ochildi.\n\n👉 <a href="https://solargrid.uz">solargrid.uz</a> saytiga kirib yangi imkoniyatlardan foydalanishingiz mumkin!`,
    proRejectedUser: `❌ <b>To'lov tasdiqlanmadi</b>\n\nAfsuski, yuborgan chekingiz tasdiqlanmadi. Iltimos to'lov ma'lumotlarini tekshirib, qayta to'lov chekini yuboring yoki admin bilan bog'laning.`,
  },
  ru: {
    welcome: `☀️ <b>Добро пожаловать в официальный бот SolarGrid!</b>\n\nПожалуйста, выберите удобный язык:`,
    langSelected: `🇷🇺 <b>Выбран русский язык.</b>\n\nДля активации SolarGrid PRO укажите ваш аккаунт (email или ID) на сайте:`,
    enterEmail: `✍️ Пожалуйста, отправьте <b>Email</b>, с которым вы зарегистрированы на сайте <b>solargrid.uz</b>:`,
    notFound: (term) =>
      `⚠️ <b>Аккаунт не найден!</b>\n\nПользователь с адресом "<code>${term}</code>" не найден.\n\nПожалуйста, сначала зарегистрируйтесь на сайте <a href="https://solargrid.uz">solargrid.uz</a> или проверьте правильность ввода Email.`,
    confirmAccount: (name, email, isPro) =>
      `🔍 <b>Аккаунт найден! Это ваш профиль?</b>\n\n👤 <b>Имя:</b> ${name}\n📧 <b>Email:</b> <code>${email}</code>\n⭐️ <b>Текущий статус:</b> ${
        isPro ? '✅ PRO Активен' : 'Стандартный (Бесплатный)'
      }\n\nЕсли всё верно, нажмите кнопку ниже:`,
    btnConfirm: `✅ Да, это мой аккаунт`,
    btnChangeAccount: `🔄 Ввести другой Email`,
    paymentInfo: `💳 <b>SolarGrid PRO — Реквизиты для оплаты</b>\n\n` +
      `⭐️ <b>Преимущества PRO:</b> Неограниченные проекты, AI Авто-раскладка, экспорт подробных смет и чертежей PDF.\n\n` +
      `💰 <b>Сумма:</b> <code>${PAYMENT_AMOUNT}</code> (подписка на 1 месяц)\n` +
      `💳 <b>Номер карты:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Получатель:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Инструкция:</b>\n` +
      `1. Переведите <b>${PAYMENT_AMOUNT}</b> на указанную карту Uzcard.\n` +
      `2. Отправьте <b>чек об оплате (скриншот или фото)</b> в этот чат.\n\n` +
      `После отправки чека администратор подтвердит оплату и активирует PRO! 🚀`,
    receiptReceived: `✅ <b>Чек об оплате принят!</b>\n\nЧек передан администратору на проверку. В течение нескольких минут ваш аккаунт будет переведен в статус PRO.\n\nСпасибо, что выбрали нас! ☀️`,
    proApprovedUser: `🎉 <b>ПОЗДРАВЛЯЕМ! ВАШ PRO СТАТУС АКТИВИРОВАН!</b>\n\nОплата успешно подтверждена. Все возможности PRO теперь доступны в вашем профиле SolarGrid.\n\n👉 Перейдите на <a href="https://solargrid.uz">solargrid.uz</a> и проектируйте без ограничений!`,
    proRejectedUser: `❌ <b>Оплата не подтверждена</b>\n\nК сожалению, чек не прошел проверку. Пожалуйста, проверьте реквизиты и отправьте корректный чек.`,
  },
  en: {
    welcome: `☀️ <b>Welcome to SolarGrid Official Bot!</b>\n\nPlease select your preferred language:`,
    langSelected: `🇬🇧 <b>English selected.</b>\n\nTo activate SolarGrid PRO, enter your account email or ID registered on our website:`,
    enterEmail: `✍️ Please send your <b>registered Email</b> on <b>solargrid.uz</b>:`,
    notFound: (term) =>
      `⚠️ <b>Account not found!</b>\n\nNo user found with "<code>${term}</code>".\n\nPlease register first at <a href="https://solargrid.uz">solargrid.uz</a> and try again.`,
    confirmAccount: (name, email, isPro) =>
      `🔍 <b>Account found! Is this your profile?</b>\n\n👤 <b>Name:</b> ${name}\n📧 <b>Email:</b> <code>${email}</code>\n⭐️ <b>Status:</b> ${
        isPro ? '✅ PRO Active' : 'Standard'
      }\n\nIf correct, tap the button below:`,
    btnConfirm: `✅ Yes, this is my account`,
    btnChangeAccount: `🔄 Enter another Email`,
    paymentInfo: `💳 <b>SolarGrid PRO — Payment Details</b>\n\n` +
      `⭐️ <b>PRO Features:</b> Unlimited projects, AI auto-layout, PDF estimates and drawings.\n\n` +
      `💰 <b>Amount:</b> <code>${PAYMENT_AMOUNT}</code> (1 month)\n` +
      `💳 <b>Card:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Cardholder:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Instructions:</b>\n` +
      `1. Transfer <b>${PAYMENT_AMOUNT}</b> to the Uzcard above.\n` +
      `2. Send the <b>payment receipt (screenshot or photo)</b> to this bot.\n\n` +
      `Our admin will review and activate your PRO status in minutes! 🚀`,
    receiptReceived: `✅ <b>Receipt received!</b>\n\nYour receipt was forwarded to our administrator for verification. Your PRO status will be activated shortly.`,
    proApprovedUser: `🎉 <b>CONGRATULATIONS! PRO ACTIVATED!</b>\n\nYour payment has been verified. All PRO features on SolarGrid are now unlocked for you.\n\n👉 Visit <a href="https://solargrid.uz">solargrid.uz</a> now!`,
    proRejectedUser: `❌ <b>Payment not approved</b>\n\nUnfortunately your receipt could not be verified. Please check and send a valid receipt.`,
  },
};

const sessions = new Map();

function getSession(chatId) {
  let s = sessions.get(chatId);
  if (!s) {
    s = { chatId, lang: 'uz', step: 'SELECT_LANG' };
    sessions.set(chatId, s);
  }
  return s;
}

function updateSession(chatId, partial) {
  const s = getSession(chatId);
  const updated = { ...s, ...partial };
  sessions.set(chatId, updated);
  return updated;
}

async function sendLanguageSelection(chatId) {
  const keyboard = {
    inline_keyboard: [
      [
        { text: "🇺🇿 O'zbekcha", callback_data: 'lang_uz' },
        { text: '🇷🇺 Русский', callback_data: 'lang_ru' },
        { text: '🇬🇧 English', callback_data: 'lang_en' },
      ],
    ],
  };
  await sendMessage(chatId, TEXTS.uz.welcome, keyboard);
}

async function showAccountConfirmation(chatId, account, lang = 'uz') {
  const t = TEXTS[lang] || TEXTS.uz;
  const keyboard = {
    inline_keyboard: [
      [{ text: t.btnConfirm, callback_data: 'confirm_account' }],
      [{ text: t.btnChangeAccount, callback_data: 'change_account' }],
    ],
  };
  await sendMessage(
    chatId,
    t.confirmAccount(account.fullName || 'Foydalanuvchi', account.email, account.isPro),
    keyboard
  );
}

// Bitta update ni qayta ishlash
async function processUpdate(update) {
  try {
    // 1. Callback query
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;
      const data = cq.data;
      const session = getSession(chatId);
      await answerCallbackQuery(cq.id);

      // Til tanlash
      if (data.startsWith('lang_')) {
        const lang = data.replace('lang_', '');
        updateSession(chatId, { lang, step: 'ENTER_ACCOUNT' });
        const t = TEXTS[lang] || TEXTS.uz;
        await sendMessage(chatId, t.langSelected);

        if (session.accountData) {
          await showAccountConfirmation(chatId, session.accountData, lang);
        } else {
          await sendMessage(chatId, t.enterEmail);
        }
        return;
      }

      // Akkauntni tasdiqlash
      if (data === 'confirm_account') {
        const t = TEXTS[session.lang] || TEXTS.uz;
        updateSession(chatId, { step: 'WAITING_RECEIPT' });
        const keyboard = {
          inline_keyboard: [[{ text: t.btnChangeAccount, callback_data: 'change_account' }]],
        };
        await sendMessage(chatId, t.paymentInfo, keyboard);
        return;
      }

      // Boshqa akkaunt
      if (data === 'change_account') {
        const t = TEXTS[session.lang] || TEXTS.uz;
        updateSession(chatId, { step: 'ENTER_ACCOUNT', accountData: undefined });
        await sendMessage(chatId, t.enterEmail);
        return;
      }

      // ADMIN: PRO faollashtirish
      if (data.startsWith('approve_pro_')) {
        const targetUserId = data.replace('approve_pro_', '');
        const success = await setProStatusInSupabase(targetUserId, true);

        if (success) {
          await editMessageText(
            chatId,
            cq.message.message_id,
            `${cq.message.text || cq.message.caption || ''}\n\n✅ <b>ADMIN TASDIQLADI: PRO FAOLLASHTIRILDI!</b>`
          );

          for (const [uChatId, s] of sessions.entries()) {
            if (s.accountData?.id === targetUserId) {
              const t = TEXTS[s.lang] || TEXTS.uz;
              await sendMessage(uChatId, t.proApprovedUser);
            }
          }
        }
        return;
      }

      // ADMIN: PRO rad etish
      if (data.startsWith('reject_pro_')) {
        const targetUserId = data.replace('reject_pro_', '');
        await editMessageText(
          chatId,
          cq.message.message_id,
          `${cq.message.text || cq.message.caption || ''}\n\n❌ <b>ADMIN RAD ETDI!</b>`
        );

        for (const [uChatId, s] of sessions.entries()) {
          if (s.accountData?.id === targetUserId) {
            const t = TEXTS[s.lang] || TEXTS.uz;
            await sendMessage(uChatId, t.proRejectedUser);
          }
        }
        return;
      }
      return;
    }

    // 2. Xabar
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text ? msg.text.trim() : '';
      const session = getSession(chatId);
      const lang = session.lang || 'uz';
      const t = TEXTS[lang] || TEXTS.uz;

      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1].trim() : '';

        if (startParam) {
          let decodedParam = startParam;
          try {
            if (!startParam.includes('@')) {
              decodedParam = Buffer.from(startParam, 'base64').toString('utf-8');
            }
          } catch (e) {}

          const user = await findUserInSupabase(decodedParam);
          if (user) {
            updateSession(chatId, { accountData: user });
          }
        }

        await sendLanguageSelection(chatId);
        return;
      }

      if (text === '/lang' || text === '/language') {
        await sendLanguageSelection(chatId);
        return;
      }

      if (text === '/admin' || text === '/setadmin') {
        await sendMessage(
          chatId,
          `👑 <b>Siz SolarGrid administratorisiz!</b>\n\nChat ID: <code>${chatId}</code>\nBarcha to'lov cheklari ushbu chatga keladi.`
        );
        return;
      }

      // Rasm (Chek) kelganda
      if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1];
        const photoFileId = photo.file_id;
        const currentAccount = session.accountData;
        const senderName = msg.from?.first_name || 'Foydalanuvchi';
        const senderUsername = msg.from?.username ? `@${msg.from.username}` : "Username yo'q";

        await sendMessage(chatId, t.receiptReceived);

        const adminCaption =
          `🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n` +
          `👤 <b>Telegram:</b> ${senderName} (${senderUsername})\n` +
          `🆔 <b>Telegram Chat ID:</b> <code>${chatId}</code>\n` +
          `📧 <b>SolarGrid Email:</b> <code>${currentAccount?.email || "Ko'rsatilmagan"}</code>\n` +
          `👤 <b>SolarGrid Ism:</b> ${currentAccount?.fullName || "Ko'rsatilmagan"}\n` +
          `🆔 <b>SolarGrid ID:</b> <code>${currentAccount?.id || 'Noma\'lum'}</code>\n` +
          `💰 <b>Summa:</b> ${PAYMENT_AMOUNT}\n` +
          `💳 <b>Karta:</b> ${PAYMENT_CARD} (${PAYMENT_CARD_HOLDER})\n\n` +
          `Iltimos, to'lovni tekshirib tasdiqlang:`;

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '✅ Tasdiqlash (PRO faollashtirish)',
                callback_data: `approve_pro_${currentAccount?.id || 'unknown'}`,
              },
              {
                text: '❌ Rad etish',
                callback_data: `reject_pro_${currentAccount?.id || 'unknown'}`,
              },
            ],
          ],
        };

        await sendPhoto(ADMIN_CHAT_ID, photoFileId, adminCaption, inlineKeyboard);
        updateSession(chatId, { step: 'COMPLETED' });
        return;
      }

      // Matnli xabar (Email / ID qidirish)
      if (text) {
        const found = await findUserInSupabase(text);
        if (!found) {
          await sendMessage(chatId, t.notFound(text));
        } else {
          updateSession(chatId, { accountData: found, step: 'CONFIRM_ACCOUNT' });
          await showAccountConfirmation(chatId, found, lang);
        }
        return;
      }
    }
  } catch (err) {
    console.error('Update xatosi:', err);
  }
}

// Long-polling tsikli
let offset = 0;
async function startPolling() {
  console.log('🚀 SolarGrid Telegram Bot Polling ishga tushdi!');
  console.log(`Bot: @solargridpro_bot | Admin ID: ${ADMIN_CHAT_ID}`);

  while (true) {
    try {
      const res = await fetch(`${TELEGRAM_API}/getUpdates?offset=${offset}&timeout=20`);
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          await processUpdate(update);
        }
      }
    } catch (err) {
      console.error('Polling xatosi:', err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

startPolling();
