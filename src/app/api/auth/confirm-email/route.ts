import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email kiritilishi shart' },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // Foydalanuvchilar ro'yxatidan qidirish
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) {
      return NextResponse.json({ error: listError.message }, { status: 500 });
    }

    const targetUser = listData.users.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Bunday email bilan foydalanuvchi topilmadi' },
        { status: 404 }
      );
    }

    // Foydalanuvchini emailini tasdiqlangan (email_confirm: true) holatga keltirish
    const { data: updated, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      {
        email_confirm: true,
      }
    );

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Email muvaffaqiyatli tasdiqlandi',
      user: updated.user,
    });
  } catch (err: any) {
    console.error('Confirm-email API xatosi:', err);
    return NextResponse.json(
      { error: err.message || 'Server xatosi' },
      { status: 500 }
    );
  }
}
