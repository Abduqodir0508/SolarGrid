import { supabaseAdmin } from './supabaseAdmin';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '9272360178:AAFwtCPYDyLwsc7nHXPb0ZMf8x1YW8LKv_4';
let dynamicAdminChatId: number | string = process.env.TELEGRAM_ADMIN_CHAT_ID || '2067464475';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Karta va yangi rasmiy narxlar
export const PAYMENT_CARD = '5614 6887 1438 0671';
export const PAYMENT_CARD_HOLDER = 'M.S (Uzcard)';
export const PRICE_FIRST_MONTH = 150000; // 150,000 UZS (1-oylik start narxi)
export const PRICE_RENEWAL = 280000;    // 280,000 UZS (Keyingi oylar / uzaytirish)

export type BotLang = 'uz' | 'ru' | 'en';

export interface UserBotSession {
  chatId: number;
  userId?: number;
  lang: BotLang;
  step: 'SELECT_LANG' | 'ENTER_ACCOUNT' | 'CONFIRM_ACCOUNT' | 'WAITING_RECEIPT' | 'COMPLETED';
  accountData?: {
    id: string;
    email: string;
    fullName?: string;
    isPro: boolean;
    expiresAt?: string | null;
    monthsCount: number;
    calculatedPrice: number;
    isFirstTime: boolean;
  };
}

// Xotirada sessiyalarni saqlash
const sessionsMap = new Map<number, UserBotSession>();

export function getSession(chatId: number): UserBotSession {
  let session = sessionsMap.get(chatId);
  if (!session) {
    session = {
      chatId,
      lang: 'uz',
      step: 'SELECT_LANG',
    };
    sessionsMap.set(chatId, session);
  }
  return session;
}

export function updateSession(chatId: number, update: Partial<UserBotSession>): UserBotSession {
  const current = getSession(chatId);
  const updated = { ...current, ...update };
  sessionsMap.set(chatId, updated);
  return updated;
}

// Telegram API yordamchi chaqiriqlari
export async function tgCall(method: string, payload: any) {
  if (!TELEGRAM_BOT_TOKEN) return null;
  try {
    const res = await fetch(`${TELEGRAM_API}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`Telegram API xatosi (${method}):`, err);
    return null;
  }
}

export async function sendMessage(chatId: number | string, text: string, replyMarkup?: any) {
  return tgCall('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

export async function sendPhoto(
  chatId: number | string,
  photoFileId: string,
  caption: string,
  replyMarkup?: any
) {
  return tgCall('sendPhoto', {
    chat_id: chatId,
    photo: photoFileId,
    caption,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return tgCall('answerCallbackQuery', {
    callback_query_id: callbackQueryId,
    text,
  });
}

export async function editMessageText(
  chatId: number | string,
  messageId: number,
  text: string,
  replyMarkup?: any
) {
  return tgCall('editMessageText', {
    chat_id: chatId,
    message_id: messageId,
    text,
    parse_mode: 'HTML',
    reply_markup: replyMarkup,
  });
}

// Narxni chiroyli formatlash
export function formatUzs(amount: number): string {
  return amount.toLocaleString('uz-UZ') + " so'm";
}

// Sanani chiroyli formatlash
export function formatDate(isoDate: string): string {
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

// Ko'p tilli xabarlar lug'ati
const TEXTS = {
  uz: {
    welcome: `☀️ <b>SolarGrid Rasmiy Botiga Xush Kelibsiz!</b>\n\nIltimos, muloqot tilini tanlang:\nПожалуйста, выберите язык:\nPlease select a language:`,
    langSelected: `🇺🇿 <b>O'zbek tili tanlandi.</b>`,
    enterEmail: `✍️ Iltimos, <b>solargrid.uz</b> saytida ro'yxatdan o'tgan <b>elektron pochtangiz (Email)</b> yoki <b>User ID</b> raqamingizni yuboring:`,
    notFound: (term: string) =>
      `⚠️ <b>Siz avval solargrid.uz saytida ro'yxatdan o'tmagansiz.</b>\n\nKiritilgan "<code>${term}</code>" bo'yicha akkaunt topilmadi.\n\nIltimos, avval saytdan akkaunt oching va qayta urinib ko'ring:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nAkkaunt ochgach, emailingizni shu yerga yozing.`,
    confirmAccount: (name: string, email: string, isPro: boolean, expiresText: string, priceStr: string, isFirstTime: boolean) =>
      `🔍 <b>Akkaunt topildi! Shu sizning akkauntingizmi?</b>\n\n` +
      `👤 <b>Ism:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Holat:</b> ${isPro ? `✅ PRO Faol (${expiresText} gacha)` : 'Standart (Tekin)'}\n\n` +
      `💰 <b>Tarif narxi:</b> <b>${priceStr}</b> (30 kunlik kirish)\n` +
      `📌 <i>${isFirstTime ? "🔥 Start aksiya: Birinchi oy uchun maxsus narx!" : "🔄 Standart narx: Obunani 30 kunga uzaytirish."}</i>\n\n` +
      `Agar ma'lumotlar to'g'ri bo'lsa, davom etish tugmasini bosing:`,
    btnConfirm: `✅ Ha, bu mening akkauntim`,
    btnChangeAccount: `🔄 Boshqa akkaunt kiritish`,
    paymentInfo: (priceStr: string, isFirstTime: boolean) =>
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
    proApprovedUser: (expiresFormatted: string) =>
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
    notFound: (term: string) =>
      `⚠️ <b>Вы еще не зарегистрированы на сайте solargrid.uz.</b>\n\nАккаунт по запросу "<code>${term}</code>" не найден.\n\nПожалуйста, сначала создайте аккаунт на сайте:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nПосле регистрации отправьте ваш Email сюда.`,
    confirmAccount: (name: string, email: string, isPro: boolean, expiresText: string, priceStr: string, isFirstTime: boolean) =>
      `🔍 <b>Аккаунт найден! Это ваш профиль?</b>\n\n` +
      `👤 <b>Имя:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Статус:</b> ${isPro ? `✅ PRO Активен (до ${expiresText})` : 'Стандартный (Бесплатный)'}\n\n` +
      `💰 <b>Стоимость тарифа:</b> <b>${priceStr}</b> (30 дней)\n` +
      `📌 <i>${isFirstTime ? "🔥 Старт акция: Спеццена на первый месяц!" : "🔄 Стандартная цена: Продление на 30 дней."}</i>\n\n` +
      `Если данные верны, нажмите кнопку подтверждения:`,
    btnConfirm: `✅ Да, это мой аккаунт`,
    btnChangeAccount: `🔄 Ввести другой аккаунт`,
    paymentInfo: (priceStr: string, isFirstTime: boolean) =>
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
    proApprovedUser: (expiresFormatted: string) =>
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
    notFound: (term: string) =>
      `⚠️ <b>You are not registered on solargrid.uz yet.</b>\n\nNo account found for "<code>${term}</code>".\n\nPlease register on our website first:\n👉 <a href="https://solargrid.uz">https://solargrid.uz</a>\n\nThen send your registered Email here.`,
    confirmAccount: (name: string, email: string, isPro: boolean, expiresText: string, priceStr: string, isFirstTime: boolean) =>
      `🔍 <b>Account found! Is this your profile?</b>\n\n` +
      `👤 <b>Name:</b> ${name}\n` +
      `📧 <b>Email:</b> <code>${email}</code>\n` +
      `⭐️ <b>Status:</b> ${isPro ? `✅ PRO Active (until ${expiresText})` : 'Standard'}\n\n` +
      `💰 <b>Tariff price:</b> <b>${priceStr}</b> (30 days)\n` +
      `📌 <i>${isFirstTime ? "🔥 Starter Promo: Special price for the 1st month!" : "🔄 Standard renewal: 30 days extension."}</i>\n\n` +
      `If correct, tap confirm below:`,
    btnConfirm: `✅ Yes, this is my account`,
    btnChangeAccount: `🔄 Enter another account`,
    paymentInfo: (priceStr: string, isFirstTime: boolean) =>
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
    proApprovedUser: (expiresFormatted: string) =>
      `🎉 <b>CONGRATULATIONS! YOUR PRO PLAN IS ACTIVATED!</b>\n\n` +
      `Your payment has been verified.\n` +
      `📅 <b>Valid until:</b> ${expiresFormatted} (30 days).\n\n` +
      `Visit <a href="https://solargrid.uz">solargrid.uz</a> and enjoy full PRO features! ☀️`,
    proRejectedUser: `❌ <b>Payment not approved</b>\n\nUnfortunately your receipt could not be verified. Please check and submit a valid receipt or contact @A_Husanboyev.`,
  },
};

/**
 * Supabase dan email yoki ID bo'yicha foydalanuvchini qidirish
 * Yangi narx modeliga asosan: 1-oy bo'lsa 150,000 so'm, avval olgan bo'lsa 280,000 so'm hisoblanadi!
 */
export async function findUserInSupabase(term: string) {
  try {
    const cleanTerm = term.trim().toLowerCase();
    const { data, error } = await supabaseAdmin.auth.admin.listUsers();
    if (error || !data?.users) {
      console.error('Supabase listUsers xatosi:', error);
      return null;
    }

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

    // Muddat tekshiruvi
    let isPro = !!metadata.is_pro;
    if (expiresAt && new Date() > new Date(expiresAt)) {
      isPro = false;
    }

    // Birinchi marta oluvchi: agar ilgari pro_months_count bo'lmasa va pro_activated_at bo'lmasa
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
    console.error('findUserInSupabase xatosi:', err);
    return null;
  }
}

/**
 * Supabase da foydalanuvchiga PRO status berish va 30 kunlik muddat qo'shish
 */
export async function setProStatusInSupabase(userId: string, isPro: boolean, amountPaid?: number) {
  try {
    if (!isPro) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: { is_pro: false },
      });
      return { success: true, expiresAt: null };
    }

    // Mavjud foydalanuvchini olish
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
    const existingMeta = userData?.user?.user_metadata || {};
    const currentMonths = Number(existingMeta.pro_months_count || 0);
    const currentExpiry = existingMeta.pro_expires_at ? new Date(existingMeta.pro_expires_at) : null;

    // Yangi muddat hisoblash (+30 kun)
    // Agar mavjud muddat kelajakda bo'lsa, unga 30 kun qo'shiladi; aks holda hozirdan 30 kun
    let startDate = new Date();
    let newExpiryDate = new Date();

    if (currentExpiry && currentExpiry > new Date()) {
      newExpiryDate = new Date(currentExpiry);
    }
    newExpiryDate.setDate(newExpiryDate.getDate() + 30);

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
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
    });

    if (error) {
      console.error('Supabase update user PRO xatosi:', error);
      return { success: false, expiresAt: null };
    }

    return { success: true, expiresAt: newExpiryDate.toISOString() };
  } catch (err) {
    console.error('setProStatusInSupabase xatosi:', err);
    return { success: false, expiresAt: null };
  }
}

/**
 * Bot tilini tanlash menyusi
 */
export async function sendLanguageSelection(chatId: number) {
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

/**
 * Akkaunt tasdiqlash menyusini ko'rsatish
 */
export async function showAccountConfirmation(chatId: number, account: any, lang: BotLang) {
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

/**
 * Telegram Update larni qayta ishlash asosiy funksiyasi
 */
export async function handleTelegramUpdate(update: any) {
  try {
    // 1. Callback query (Tugma bosilganda)
    if (update.callback_query) {
      const cq = update.callback_query;
      const chatId = cq.message.chat.id;
      const data = cq.data as string;
      const session = getSession(chatId);

      await answerCallbackQuery(cq.id);

      // Til tanlash
      if (data.startsWith('lang_')) {
        const lang = data.replace('lang_', '') as BotLang;
        updateSession(chatId, { lang, step: 'ENTER_ACCOUNT' });
        const t = TEXTS[lang] || TEXTS.uz;

        await sendMessage(chatId, t.langSelected);

        // Agar start parametri orqali akkaunt allaqachon topilgan bo'lsa
        if (session.accountData) {
          await showAccountConfirmation(chatId, session.accountData, lang);
        } else {
          await sendMessage(chatId, t.enterEmail);
        }
        return;
      }

      // Akkauntni tasdiqlash -> To'lov ma'lumotlari chiqadi
      if (data === 'confirm_account') {
        const t = TEXTS[session.lang] || TEXTS.uz;
        updateSession(chatId, { step: 'WAITING_RECEIPT' });

        const account = session.accountData;
        const priceStr = account ? formatUzs(account.calculatedPrice) : formatUzs(PRICE_FIRST_MONTH);
        const isFirst = account ? account.isFirstTime : true;

        const keyboard = {
          inline_keyboard: [
            [{ text: t.btnChangeAccount, callback_data: 'change_account' }],
          ],
        };

        await sendMessage(chatId, t.paymentInfo(priceStr, isFirst), keyboard);
        return;
      }

      // Boshqa akkaunt kiritish
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

          // Foydalanuvchiga Telegramda bildirishnoma yuborish
          Array.from(sessionsMap.entries()).forEach(async ([userChatId, s]) => {
            if (s.accountData?.id === targetUserId) {
              const langKey = (s.lang || 'uz') as BotLang;
              const t = TEXTS[langKey] || TEXTS.uz;
              await sendMessage(userChatId, t.proApprovedUser(expiresFormatted));
            }
          });
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

        Array.from(sessionsMap.entries()).forEach(async ([userChatId, s]) => {
          if (s.accountData?.id === targetUserId) {
            const langKey = (s.lang || 'uz') as BotLang;
            const t = TEXTS[langKey] || TEXTS.uz;
            await sendMessage(userChatId, t.proRejectedUser);
          }
        });
        return;
      }

      return;
    }

    // 2. Oddiy xabar (Message)
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const text = msg.text ? msg.text.trim() : '';
      const session = getSession(chatId);
      const lang = session.lang || 'uz';
      const t = TEXTS[lang] || TEXTS.uz;

      // /start komandasi (deep-link ?start=USER_ID)
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

        // Har doim avval til tanlashni ko'rsatamiz
        await sendLanguageSelection(chatId);
        return;
      }

      // /lang komandasi
      if (text === '/lang' || text === '/language') {
        await sendLanguageSelection(chatId);
        return;
      }

      // /admin komandasi
      if (text === '/admin' || text === '/setadmin') {
        dynamicAdminChatId = chatId;
        await sendMessage(
          chatId,
          `👑 <b>Siz SolarGrid bosh administratorisiz!</b>\n\nAdmin ID: <code>${chatId}</code>\nBarcha yangi to'lov cheklari ushbu chatga keladi.`
        );
        return;
      }

      // Rasm (To'lov cheki) yuborilganda
      if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1]; // Eng sifatli rasm
        const photoFileId = photo.file_id;

        const currentAccount = session.accountData;
        const senderName = msg.from?.first_name || 'Foydalanuvchi';
        const senderUsername = msg.from?.username ? `@${msg.from.username}` : "Username yo'q";

        await sendMessage(chatId, t.receiptReceived);

        const priceAmount = currentAccount?.calculatedPrice || PRICE_FIRST_MONTH;
        const priceStr = formatUzs(priceAmount);
        const tariffLabel = currentAccount?.isFirstTime
          ? "🔥 1-Oylik Boshlang'ich Tarif (Start narx)"
          : "🔄 Keyingi Oy (Obunani uzaytirish)";

        // Adminga (ID: 2067464475) chekni yuborish
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

        const targetAdminId = dynamicAdminChatId || '2067464475';
        await sendPhoto(targetAdminId, photoFileId, adminCaption, inlineKeyboard);
        updateSession(chatId, { step: 'COMPLETED' });
        return;
      }

      // Matnli xabar kelganda (Email yoki ID qidirish)
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
  } catch (error) {
    console.error('handleTelegramUpdate global xatosi:', error);
  }
}
