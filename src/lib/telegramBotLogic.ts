import { supabaseAdmin } from './supabaseAdmin';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
let dynamicAdminChatId: number | string = process.env.TELEGRAM_ADMIN_CHAT_ID || '2067464475';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

// Karta va to'lov rekvizitlari
export const PAYMENT_CARD = '5614 6887 1438 0671';
export const PAYMENT_CARD_HOLDER = 'M.S (Uzcard)';
export const PAYMENT_AMOUNT = '49,000 UZS';

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
  };
}

// Xotirada sessiyalarni saqlash (oddiy va tezkor kesh)
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
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN belgilanmagan. Telegram chaqiruv o\'tkazib yuborildi:', method);
    return null;
  }

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

// Ko'p tilli matnlar
const TEXTS = {
  uz: {
    welcome: `☀️ <b>SolarGrid Rasmiy Botiga Xush Kelibsiz!</b>\n\nIltimos, qulay muloqot tilini tanlang:\nПожалуйста, выберите язык:\nPlease select a language:`,
    langSelected: `🇺🇿 <b>O'zbek tili tanlandi.</b>\n\nSolarGrid PRO versiyasini faollashtirish uchun saytimizdagi akkauntingiz (email yoki ID)ni kiriting:`,
    enterEmail: `✍️ Iltimos, <b>solargrid.uz</b> saytida ro'yxatdan o'tgan <b>elektron pochtangizni (Email)</b> yozib yuboring:`,
    notFound: (term: string) =>
      `⚠️ <b>Bunday akkaunt topilmadi!</b>\n\nSiz kiritgan "<code>${term}</code>" bo'yicha foydalanuvchi mavjud emas.\n\nIltimos, avval <a href="https://solargrid.uz">solargrid.uz</a> saytida ro'yxatdan o'ting, so'ng qayta urinib ko'ring yoki to'g'ri emailni qaytadan yozing.`,
    confirmAccount: (name: string, email: string, isPro: boolean) =>
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
    alreadyPro: `⭐️ Sizning hisobingizda PRO versiya allaqachon faol! Qo'shimcha muddat uzaytirish uchun to'lov chekini yuborishingiz mumkin.`,
    receiptReceived: `✅ <b>To'lov cheki qabul qilindi!</b>\n\nChekingiz tekshirish uchun ma'muriyatga (admin) yuborildi. Bir necha daqiqada to'lov tasdiqlanib, saytda PRO status yoqiladi.\n\nBiz bilan ekanligingizdan mamnunmiz! ☀️`,
    proApprovedUser: `🎉 <b>TABRIKLAYMIZ! PRO VERSIYA FAOLLASHTIRILDI!</b>\n\nSizning to'lovingiz muvaffaqiyatli tasdiqlandi. SolarGrid akkauntingizda barcha PRO imkoniyatlar (AI terish, cheksiz papkalar, PDF smeta) ochildi.\n\n👉 <a href="https://solargrid.uz">solargrid.uz</a> saytiga kirib yangi imkoniyatlardan foydalanishingiz mumkin!`,
    proRejectedUser: `❌ <b>To'lov tasdiqlanmadi</b>\n\nAfsuski, yuborgan chekingiz tasdiqlanmadi. Iltimos to'lov ma'lumotlarini tekshirib, qayta to'lov chekini yuboring yoki admin bilan bog'laning.`,
  },
  ru: {
    welcome: `☀️ <b>Добро пожаловать в официальный бот SolarGrid!</b>\n\nПожалуйста, выберите удобный язык:`,
    langSelected: `🇷🇺 <b>Выбран русский язык.</b>\n\nДля активации SolarGrid PRO укажите ваш аккаунт (email или ID) на сайте:`,
    enterEmail: `✍️ Пожалуйста, отправьте <b>Email</b>, с которым вы зарегистрированы на сайте <b>solargrid.uz</b>:`,
    notFound: (term: string) =>
      `⚠️ <b>Аккаунт не найден!</b>\n\nПользователь с адресом "<code>${term}</code>" не найден.\n\nПожалуйста, сначала зарегистрируйтесь на сайте <a href="https://solargrid.uz">solargrid.uz</a> или проверьте правильность ввода Email.`,
    confirmAccount: (name: string, email: string, isPro: boolean) =>
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
    alreadyPro: `⭐️ На вашем аккаунте уже активен PRO статус! Вы можете продлить его, отправив чек.`,
    receiptReceived: `✅ <b>Чек об оплате принят!</b>\n\nЧек передан администратору на проверку. В течение нескольких минут ваш аккаунт будет переведен в статус PRO.\n\nСпасибо, что выбрали нас! ☀️`,
    proApprovedUser: `🎉 <b>ПОЗДРАВЛЯЕМ! ВАШ PRO СТАТУС АКТИВИРОВАН!</b>\n\nОплата успешно подтверждена. Все возможности PRO теперь доступны в вашем профиле SolarGrid.\n\n👉 Перейдите на <a href="https://solargrid.uz">solargrid.uz</a> и проектируйте без ограничений!`,
    proRejectedUser: `❌ <b>Оплата не подтверждена</b>\n\nК сожалению, чек не прошел проверку. Пожалуйста, проверьте реквизиты и отправьте корректный чек.`,
  },
  en: {
    welcome: `☀️ <b>Welcome to SolarGrid Official Bot!</b>\n\nPlease select your preferred language:`,
    langSelected: `🇬🇧 <b>English selected.</b>\n\nTo activate SolarGrid PRO, enter your account email or ID registered on our website:`,
    enterEmail: `✍️ Please send your <b>registered Email</b> on <b>solargrid.uz</b>:`,
    notFound: (term: string) =>
      `⚠️ <b>Account not found!</b>\n\nNo user found with "<code>${term}</code>".\n\nPlease register first at <a href="https://solargrid.uz">solargrid.uz</a> and try again.`,
    confirmAccount: (name: string, email: string, isPro: boolean) =>
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
    alreadyPro: `⭐️ PRO is already active on your account! You can extend it by submitting a payment receipt.`,
    receiptReceived: `✅ <b>Receipt received!</b>\n\nYour receipt was forwarded to our administrator for verification. Your PRO status will be activated shortly.`,
    proApprovedUser: `🎉 <b>CONGRATULATIONS! PRO ACTIVATED!</b>\n\nYour payment has been verified. All PRO features on SolarGrid are now unlocked for you.\n\n👉 Visit <a href="https://solargrid.uz">solargrid.uz</a> now!`,
    proRejectedUser: `❌ <b>Payment not approved</b>\n\nUnfortunately your receipt could not be verified. Please check and send a valid receipt.`,
  },
};

/**
 * Supabase dan email yoki ID bo'yicha foydalanuvchini qidirish
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
    console.error('findUserInSupabase xatosi:', err);
    return null;
  }
}

/**
 * Supabase da foydalanuvchiga PRO status berish
 */
export async function setProStatusInSupabase(userId: string, isPro: boolean) {
  try {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 kunga faollashtirish

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: {
        is_pro: isPro,
        pro_activated_at: new Date().toISOString(),
        pro_expires_at: isPro ? expiresAt.toISOString() : null,
        payment_verified_via: 'telegram_bot',
      },
    });

    if (error) {
      console.error('Supabase update user PRO xatosi:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('setProStatusInSupabase xatosi:', err);
    return false;
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
        const t = TEXTS[lang];

        await sendMessage(chatId, t.langSelected);

        // Agar oldindan start parametri orqali kelgan bo'lsa
        if (session.accountData) {
          await showAccountConfirmation(chatId, session.accountData, lang);
        } else {
          await sendMessage(chatId, t.enterEmail);
        }
        return;
      }

      // Akkauntni tasdiqlash
      if (data === 'confirm_account') {
        const t = TEXTS[session.lang];
        updateSession(chatId, { step: 'WAITING_RECEIPT' });

        const keyboard = {
          inline_keyboard: [
            [{ text: t.btnChangeAccount, callback_data: 'change_account' }],
          ],
        };

        await sendMessage(chatId, t.paymentInfo, keyboard);
        return;
      }

      // Boshqa akkaunt kiritish
      if (data === 'change_account') {
        const t = TEXTS[session.lang];
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

          // Agar foydalanuvchi chatId sessiyalarda mavjud bo'lsa, xabar yuborish
          Array.from(sessionsMap.entries()).forEach(async ([userChatId, s]) => {
            if (s.accountData?.id === targetUserId) {
              const langKey = (s.lang || 'uz') as BotLang;
              const t = TEXTS[langKey] || TEXTS.uz;
              await sendMessage(userChatId, t.proApprovedUser);
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
      const t = TEXTS[lang];

      // /start komandasi
      if (text.startsWith('/start')) {
        const parts = text.split(' ');
        const startParam = parts.length > 1 ? parts[1].trim() : '';

        // Agar start parametrida email yoki ID kelsa
        if (startParam) {
          let decodedParam = startParam;
          try {
            // Agar base64 bo'lsa decode qilish
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

      // /lang komandasi
      if (text === '/lang' || text === '/language') {
        await sendLanguageSelection(chatId);
        return;
      }

      // /admin komandasi - Ushbu chatni administrator deb belgilash
      if (text === '/admin' || text === '/setadmin') {
        dynamicAdminChatId = chatId;
        await sendMessage(
          chatId,
          `👑 <b>Siz SolarGrid administrator sifatida belgilandingiz!</b>\n\nChat ID: <code>${chatId}</code>\nBarcha yangi kelgan to'lov cheklari ushbu chatga tasdiqlash uchun yuboriladi.`
        );
        return;
      }

      // Agar rasm (to'lov cheki) yuborilgan bo'lsa
      if (msg.photo && msg.photo.length > 0) {
        const photo = msg.photo[msg.photo.length - 1]; // Eng yuqori sifatli rasm
        const photoFileId = photo.file_id;

        const currentAccount = session.accountData;
        const senderName = msg.from?.first_name || 'Foydalanuvchi';
        const senderUsername = msg.from?.username ? `@${msg.from.username}` : "Username yo'q";

        await sendMessage(chatId, t.receiptReceived);

        // Adminga chekni yuborish
        const adminChatId = dynamicAdminChatId || chatId; // Agar admin ID berilmagan bo'lsa shu chatga

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

        if (dynamicAdminChatId) {
          await sendPhoto(dynamicAdminChatId, photoFileId, adminCaption, inlineKeyboard);
        } else {
          // Admin chat belgilanmagan bo'lsa test uchun shu chatga yuborish
          await sendPhoto(chatId, photoFileId, `[ADMIN TEST KANALI]\n${adminCaption}`, inlineKeyboard);
        }

        updateSession(chatId, { step: 'COMPLETED' });
        return;
      }

      // Agar matn yozilgan bo'lsa (Email yoki ID qidirish)
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

async function showAccountConfirmation(chatId: number, account: any, lang: BotLang) {
  const t = TEXTS[lang];
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
