import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email va parol kiritilishi shart' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanName = String(fullName || '').trim() || 'Foydalanuvchi';

    // 1. Foydalanuvchini admin orqali email_confirm: true bilan yaratish
    const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        is_pro: false,
      },
    });

    if (createError) {
      // Agar foydalanuvchi oldin ro'yxatdan o'tgan bo'lsa
      if (
        createError.message.includes('already registered') ||
        createError.message.includes('already exists')
      ) {
        // Mavjud foydalanuvchini topib, agar emaili tasdiqlanmagan bo'lsa darhol tasdiqlab qo'yamiz
        try {
          const { data: listData } = await supabaseAdmin.auth.admin.listUsers();
          const existingUser = listData.users.find(
            (u) => u.email?.toLowerCase() === cleanEmail
          );
          if (existingUser) {
            await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
              email_confirm: true,
            });
          }
        } catch (e) {
          console.warn('Avto-tasdiqlashda ogohlantirish:', e);
        }

        return NextResponse.json(
          {
            error: 'Ushbu email bilan foydalanuvchi allaqachon mavjud. Iltimos, Kirish (Login) qismidan kiring.',
            alreadyExists: true,
          },
          { status: 400 }
        );
      }

      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: createData.user,
      message: 'Foydalanuvchi muvaffaqiyatli ro\'yxatdan o\'tdi',
    });
  } catch (err: any) {
    console.error('Register API xatosi:', err);
    return NextResponse.json(
      { error: err.message || 'Server xatosi' },
      { status: 500 }
    );
  }
}
