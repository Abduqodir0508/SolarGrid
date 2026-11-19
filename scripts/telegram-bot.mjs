/**
 * SolarGrid Standalone Telegram Bot Runner
 * Ishga tushirish: npm run bot
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
export const PRICE_FIRST_MONTH = 150000; // 150,000 UZS
export const PRICE_RENEWAL = 280000;    // 280,000 UZS

function formatUzs(amount) {
  return Number(amount).toLocaleString('uz-UZ') + " so'm";
}

function formatDate(isoDate) {
  try {
    const d = new Date(isoDate);
    return d.toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return isoDate;
  }
}

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
        u.id.toLowerCase() === cleanTerm ||
        u.email?.toLowerCase() === cleanTerm ||
        (cleanTerm.includes('@') && u.email?.toLowerCase().includes(cleanTerm))
    );

    if (!matched) return null;

    const metadata = matched.user_metadata || {};
    const monthsCount = Number(metadata.pro_months_count || 0);
    const expiresAt = metadata.pro_expires_at || null;

    let isPro = !!metadata.is_pro;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      isPro = false;
    }

    const isFirstTime = monthsCount === 0 && !metadata.pro_activated_at;
    const calculatedPrice = isFirstTime ? PRICE_FIRST_MONTH : PRICE_RENEWAL;

    return {
      id: matched.id,
      email: matched.email || '',
      fullName: metadata.full_name || 'Foydalanuvchi',
      isPro,
      expiresAt,
      monthsCount,
      calculatedPrice,
      isFirstTime,
    };
  } catch (err) {
    console.error('Supabase qidiruv xatosi:', err.message);
    return null;
  }
}

// Supabase da PRO status berish (+30 kun)
async function setProStatusInSupabase(userId, isPro, amountPaid) {
  try {
    if (!isPro) {
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_metadata: { is_pro: false },
        }),
      });
      return { success: true, expiresAt: null };
    }

    // Mavjud ma'lumotlarni olish
    const getRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    });
    const userData = await getRes.json();
    const existingMeta = userData?.user_metadata || {};
    const currentMonths = Number(existingMeta.pro_months_count || 0);
    const currentExpiry = existingMeta.pro_expires_at ? new Date(existingMeta.pro_expires_at) : null;

    let startDate = new Date();
    let newExpiryDate = new Date();
    if (currentExpiry && currentExpiry > new Date()) {
      newExpiryDate = new Date(currentExpiry);
    }
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    const updateRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_metadata: {
          is_pro: true,
          pro_started_at: existingMeta.pro_started_at || startDate.toISOString(),
          pro_activated_at: startDate.toISOString(),
          pro_expires_at: newExpiryDate.toISOString(),
          pro_months_count: currentMonths + 1,
          last_payment_amount: amountPaid || (currentMonths === 0 ? PRICE_FIRST_MONTH : PRICE_RENEWAL),
          payment_verified_via: 'telegram_bot',
          payment_verified_at: new Date().toISOString(),
        },
      }),
    });

    return { success: updateRes.ok, expiresAt: newExpiryDate.toISOString() };
  } catch (err) {
    console.error('PRO yangilash xatosi:', err.message);
    return { success: false, expiresAt: null };
  }
}

// Matnlar
const TEXTS = {
  uz: {
    welcome: `☀️ <b>SolarGrid Rasmiy Botiga Xush Kelibsiz!</b>\n\nIltimos, muloqot tilini tanlang:\nПожалуйста, выберите язык:\nPlease select a language:`,
    langSelected: `🇺🇿 <b>O'zbek tili tanlandi.</b>`,
    enterEmail: `✍️ Iltimos, <b>solargrid.uz</b> saytida ro'yxatdan o'tgan <b>elektron pochtangiz (Email)</b> yoki <b>User ID</b> raqamingizni yuboring:`,
    notFound: (term) =>
      `⚠️ <b>Siz avval solargrid.uz saytida ro'yxatdan o'tmagansiz.</b>\n\nKiritilgan "<code>${term}</code>" bo'yicha akkaunt topilmadi.\n\nIltimos, avval saytdan akkaunt oching va qayta urinib ko'ring:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nAkkaunt ochgach, emailingizni shu yerga yozing.`,
    confirmAccount: (name, email, isPro, expiresText, priceStr, isFirstTime) =>
      `🔍 <b>Akkaunt topildi! Shu sizning akkauntingizmi?</b>\n\n` +
      `👤 <b>Ism:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Holat:</b> ${isPro ? `✅ PRO Faol (${expiresText} gacha)` : 'Standart (Tekin)'}\n\n` +
      `💰 <b>Tarif narxi:</b> <b>${priceStr}</b> (30 kunlik kirish)\n` +
      `📌 <i>${isFirstTime ? "🔥 Start aksiya: Birinchi oy uchun maxsus narx!" : "🔄 Standart narx: Obunani 30 kunga uzaytirish."}</i>\n\n` +
      `Agar ma'lumotlar to'g'ri bo'lsa, davom etish tugmasini bosing:`,
    btnConfirm: `✅ Ha, bu mening akkauntim`,
    btnChangeAccount: `🔄 Boshqa akkaunt kiritish`,
    paymentInfo: (priceStr, isFirstTime) =>
      `💳 <b>SolarGrid PRO — To'lov Ma'lumotlari</b>\n\n` +
      `⭐️ <b>Obuna turi:</b> ${isFirstTime ? "🔥 1-oy (Start narx - 30 kun)" : "🔄 Keyingi oy (Uzaytirish - 30 kun)"}\n` +
      `💰 <b>To'lov summasi:</b> <code>${priceStr}</code>\n` +
      `💳 <b>Karta raqami:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Karta egasi:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Ko'rsatma:</b>\n` +
      `1. Yuqoridagi Uzcard kartasiga aniq <b>${priceStr}</b> o'tkazing.\n` +
      `2. To'lov amalga oshirilganligi haqidagi <b>chekni (skrinshot yoki fotosurat)</b> ushbu botga rasm holatida yuboring.\n\n` +
      `Chek kelishi bilanoq administrator tekshirib, hisobingizga 30 kunlik PRO obunani yoqib beradi! 🚀`,
    receiptReceived: `✅ <b>To'lov cheki qabul qilindi!</b>\n\nChekingiz ma'muriyatga (@A_Husanboyev) tekshirish uchun yuborildi. Bir necha daqiqada to'lov tasdiqlanib, hisobingiz PRO statusiga o'tkaziladi.`,
    proApprovedUser: (expiresFormatted) =>
      `🎉 <b>TABRIKLAYMIZ! PRO TARIFINGIZ FAOLLASHTIRILDI!</b>\n\n` +
      `Sizning to'lovingiz muvaffaqiyatli tasdiqlandi.\n` +
      `📅 <b>Amal qilish muddati:</b> ${expiresFormatted} gacha (30 kun).\n\n` +
      `Endi <a href="https://solargrid.uz">solargrid.uz</a> saytiga kirib, AI avto-terish, cheksiz papkalar va montaj smetasidan to'liq foydalanishingiz mumkin! ☀️`,
    proRejectedUser: `❌ <b>To'lov tasdiqlanmadi</b>\n\nAfsuski, yuborgan chekingiz tasdiqlanmadi. Iltimos to'lov ma'lumotlarini tekshirib qayta yuboring yoki administrator @A_Husanboyev bilan bog'laning.`,
  },
  ru: {
    welcome: `☀️ <b>Добро пожаловать в официальный бот SolarGrid!</b>\n\nПожалуйста, выберите язык:\nPlease select a language:`,
    langSelected: `🇷🇺 <b>Выбран русский язык.</b>`,
    enterEmail: `✍️ Пожалуйста, отправьте <b>Email</b> или <b>User ID</b>, с которым вы зарегистрированы на <b>solargrid.uz</b>:`,
    notFound: (term) =>
      `⚠️ <b>Вы еще не зарегистрированы на сайте solargrid.uz.</b>\n\nАккаунт по запросу "<code>${term}</code>" не найден.\n\nПожалуйста, сначала создайте аккаунт на сайте:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nПосле регистрации отправьте ваш Email сюда.`,
    confirmAccount: (name, email, isPro, expiresText, priceStr, isFirstTime) =>
      `🔍 <b>Аккаунт найден! Это ваш профиль?</b>\n\n` +
      `👤 <b>Имя:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Статус:</b> ${isPro ? `✅ PRO Активен (до ${expiresText})` : 'Стандартный (Бесплатный)'}\n\n` +
      `💰 <b>Стоимость тарифа:</b> <b>${priceStr}</b> (30 дней)\n` +
      `📌 <i>${isFirstTime ? "🔥 Старт акция: Спеццена на первый месяц!" : "🔄 Стандартная цена: Продление на 30 дней."}</i>\n\n` +
      `Если данные верны, нажмите кнопку подтверждения:`,
    btnConfirm: `✅ Да, это мой аккаунт`,
    btnChangeAccount: `🔄 Ввести другой аккаунт`,
    paymentInfo: (priceStr, isFirstTime) =>
      `💳 <b>SolarGrid PRO — Реквизиты для оплаты</b>\n\n` +
      `⭐️ <b>Тип подписки:</b> ${isFirstTime ? "🔥 1-й месяц (Старт акция - 30 дней)" : "🔄 Следующий месяц (Продление - 30 дней)"}\n` +
      `💰 <b>Сумма к оплате:</b> <code>${priceStr}</code>\n` +
      `💳 <b>Номер карты:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Получатель:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Инструкция:</b>\n` +
      `1. Переведите <b>${priceStr}</b> на карту Uzcard.\n` +
      `2. Отправьте <b>чек об оплате (скриншот или фото)</b> в этот бот.\n\n` +
      `После проверки администратором PRO подписка будет активирована на 30 дней! 🚀`,
    receiptReceived: `✅ <b>Чек об оплате принят!</b>\n\nЧек передан администратору (@A_Husanboyev) на проверку. В течение нескольких минут ваш тариф будет активирован.`,
    proApprovedUser: (expiresFormatted) =>
      `🎉 <b>ПОЗДРАВЛЯЕМ! ВАШ PRO ТАРИФ АКТИВИРОВАН!</b>\n\n` +
      `Оплата успешно подтверждена.\n` +
      `📅 <b>Срок действия:</b> до ${expiresFormatted} (30 дней).\n\n` +
      `Перейдите на <a href="https://solargrid.uz">solargrid.uz</a> и пользуйтесь всеми возможностями PRO без ограничений! ☀️`,
    proRejectedUser: `❌ <b>Оплата не подтверждена</b>\n\nК сожалению, чек не прошел проверку. Пожалуйста, проверьте реквизиты и отправьте корректный чек или свяжитесь с @A_Husanboyev.`,
  },
  en: {
    welcome: `☀️ <b>Welcome to SolarGrid Official Bot!</b>\n\nPlease select your preferred language:`,
    langSelected: `🇬🇧 <b>English selected.</b>`,
    enterEmail: `✍️ Please send your registered <b>Email</b> or <b>User ID</b> on <b>solargrid.uz</b>:`,
    notFound: (term) =>
      `⚠️ <b>You are not registered on solargrid.uz yet.</b>\n\nNo account found for "<code>${term}</code>".\n\nPlease register on our website first:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nThen send your registered Email here.`,
    confirmAccount: (name, email, isPro, expiresText, priceStr, isFirstTime) =>
      `🔍 <b>Account found! Is this your profile?</b>\n\n` +
      `👤 <b>Name:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Status:</b> ${isPro ? `✅ PRO Active (until ${expiresText})` : 'Standard'}\n\n` +
      `💰 <b>Tariff price:</b> <b>${priceStr}</b> (30 days)\n` +
      `📌 <i>${isFirstTime ? "🔥 Starter Promo: Special price for the 1st month!" : "🔄 Standard renewal: 30 days extension."}</i>\n\n` +
      `If correct, tap confirm below:`,
    btnConfirm: `✅ Yes, this is my account`,
    btnChangeAccount: `🔄 Enter another account`,
    paymentInfo: (priceStr, isFirstTime) =>
      `💳 <b>SolarGrid PRO — Payment Details</b>\n\n` +
      `⭐️ <b>Plan type:</b> ${isFirstTime ? "🔥 1st Month (Starter Promo - 30 days)" : "🔄 Next Month (Renewal - 30 days)"}\n` +
      `💰 <b>Amount:</b> <code>${priceStr}</code>\n` +
      `💳 <b>Card number:</b> <code>${PAYMENT_CARD}</code>\n` +
      `👤 <b>Cardholder:</b> <b>${PAYMENT_CARD_HOLDER}</b>\n\n` +
      `📌 <b>Instructions:</b>\n` +
      `1. Transfer <b>${priceStr}</b> to the Uzcard above.\n` +
      `2. Send the <b>payment receipt (screenshot or photo)</b> to this bot.\n\n` +
      `Our admin will verify and activate your 30-day PRO plan shortly! 🚀`,
    receiptReceived: `✅ <b>Receipt received!</b>\n\nYour receipt has been forwarded to our administrator (@A_Husanboyev) for verification. Your PRO status will be activated in minutes.`,
    proApprovedUser: (expiresFormatted) =>
      `🎉 <b>CONGRATULATIONS! YOUR PRO PLAN IS ACTIVATED!</b>\n\n` +
      `Your payment has been verified.\n` +
      `📅 <b>Valid until:</b> ${expiresFormatted} (30 days).\n\n` +
      `Visit <a href="https://solargrid.uz">solargrid.uz</a> and enjoy full PRO features! ☀️`,
    proRejectedUser: `❌ <b>Payment not approved</b>\n\nUnfortunately your receipt could not be verified. Please check and submit a valid receipt or contact @A_Husanboyev.`,
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
  const priceStr = formatUzs(account.calculatedPrice);
  const expiresText = account.expiresAt ? formatDate(account.expiresAt) : 'Faol emas';

  const keyboard = {
    inline_keyboard: [
      [{ text: t.btnConfirm, callback_data: 'confirm_account' }],
      [{ text: t.btnChangeAccount, callback_data: 'change_account' }],
    ],
  };

  await sendMessage(
    chatId,
    t.confirmAccount(
      account.fullName || 'Foydalanuvchi',
      account.email,
      account.isPro,
      expiresText,
      priceStr,
      account.isFirstTime
    ),
    keyboard
  );
}

// Bitta update ni qayta ishlash
async function processUpdate(update) {
  try {
    // 1. Callback query (Tugma bosilganda)
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

        const account = session.accountData;
        const priceStr = account ? formatUzs(account.calculatedPrice) : formatUzs(PRICE_FIRST_MONTH);
        const isFirst = account ? account.isFirstTime : true;

        const keyboard = {
          inline_keyboard: [[{ text: t.btnChangeAccount, callback_data: 'change_account' }]],
        };
        await sendMessage(chatId, t.paymentInfo(priceStr, isFirst), keyboard);
        return;
      }

      // Boshqa akkaunt
      if (data === 'change_account') {
        const t = TEXTS[session.lang] || TEXTS.uz;
        updateSession(chatId, { step: 'ENTER_ACCOUNT', accountData: undefined });
        await sendMessage(chatId, t.enterEmail);
        return;
      }

      // ADMIN: PRO faollashtirish (approve_pro_{userId}_{amount})
      if (data.startsWith('approve_pro_')) {
        const parts = data.replace('approve_pro_', '').split('_');
        const targetUserId = parts[0];
        const amountPaid = parts.length > 1 ? Number(parts[1]) : PRICE_FIRST_MONTH;

        const res = await setProStatusInSupabase(targetUserId, true, amountPaid);

        if (res.success && res.expiresAt) {
          const expiresFormatted = formatDate(res.expiresAt);

          await editMessageText(
            chatId,
            cq.message.message_id,
            `${cq.message.text || cq.message.caption || ''}\n\n✅ <b>ADMIN TASDIQLADI: PRO 30 KUNGA FAOLLASHTIRILDI!</b>\n📅 <b>Amal qilish muddati:</b> ${expiresFormatted} gacha`
          );

          for (const [uChatId, s] of sessions.entries()) {
            if (s.accountData?.id === targetUserId) {
              const t = TEXTS[s.lang] || TEXTS.uz;
              await sendMessage(uChatId, t.proApprovedUser(expiresFormatted));
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

      // /start komandasi
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1].trim() : '';

        if (startParam) {
          let decodedParam = startParam;
          try {
            if (!startParam.includes('@') && !startParam.includes('-')) {
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

        const priceAmount = currentAccount?.calculatedPrice || PRICE_FIRST_MONTH;
        const priceStr = formatUzs(priceAmount);
        const tariffLabel = currentAccount?.isFirstTime
          ? "🔥 1-Oylik Boshlang'ich Tarif (Start narx - 30 kun)"
          : "🔄 Keyingi Oy (Obunani uzaytirish - 30 kun)";

        const adminCaption =
          `🔔 <b>YANGI TO'LOV CHEKI KELDI!</b>\n\n` +
          `👤 <b>Telegram:</b> ${senderName} (${senderUsername})\n` +
          `🆔 <b>Telegram Chat ID:</b> <code>${chatId}</code>\n\n` +
          `🌐 <b>SolarGrid Akkaunt:</b>\n` +
          `👤 <b>Ism:</b> ${currentAccount?.fullName || "Ko'rsatilmagan"}\n` +
          `📧 <b>Email:</b> <code>${currentAccount?.email || "Ko'rsatilmagan"}</code>\n` +
          `🆔 <b>User ID:</b> <code>${currentAccount?.id || "Noma'lum"}</code>\n\n` +
          `💰 <b>Hisoblangan summa:</b> <b>${priceStr}</b>\n` +
          `📊 <b>Tarif turi:</b> ${tariffLabel}\n` +
          `💳 <b>Karta:</b> ${PAYMENT_CARD} (${PAYMENT_CARD_HOLDER})\n\n` +
          `Iltimos, to'lovni tekshirib tasdiqlang:`;

        const inlineKeyboard = {
          inline_keyboard: [
            [
              {
                text: '✅ Tasdiqlash (PRO faollashtirish)',
                callback_data: `approve_pro_${currentAccount?.id || 'unknown'}_${priceAmount}`,
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
