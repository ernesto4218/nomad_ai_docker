import { validateInitData } from '$lib/telegram';
import { env } from '$env/dynamic/private';
import { json, error } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { userRepository } from '$lib/server/repositories/user';
import jwt from 'jsonwebtoken';
import { db } from '$lib/server/db';

export async function POST({ request, cookies, platform }) {

  const repo = userRepository(db);

  // 3. Parse request
  const { initData, ref } = await request.json() as { initData: string, ref: number | null };  
  
  const isMock = dev && (!initData || initData === 'undefined');
  const dataToValidate = isMock ? env.TELEGRAM_MOCK_INIT_DATA : initData;
  
  if (!dataToValidate) {
    throw error(400, 'No initData provided');
  }

  let result;
  if (isMock) {
    const params = new URLSearchParams(dataToValidate);
    result = { ok: true, data: Object.fromEntries(params) };
  } else {
    result = await validateInitData(dataToValidate, env.TELEGRAM_BOT_TOKEN);
  }

  if (!result.ok) {
    throw error(401, result.error || 'Unauthorized');
  }

  const rawUser = result.data?.user ? JSON.parse(result.data.user) : null;
  if (!rawUser) throw error(400, 'User data missing from initData');

  // 4. Transform to match the schema
  const userData = {
    userId: Number(rawUser.id),              
    firstName: rawUser.first_name || null,
    lastName: rawUser.last_name || null,
    username: rawUser.username || null,
    languageCode: rawUser.language_code || null,
    isPremium: !!rawUser.is_premium, 
    photoUrl: rawUser.photo_url || null,
  };

  // 5. Upsert User
  const user = await repo.upsert(userData, ref ? Number(ref) : null); 
  
  if (!user) {
    throw error(500, 'Failed to sync user data');
  }

  // 6. JWT Signing
  // We explicitly pick fields to avoid BigInt serialization issues in JWT
  const token = jwt.sign(
      { 
        user: { 
          userId: Number(user.userId), 
          username: user.username 
        } 
      },
      env.JWT_SECRET,
      { expiresIn: '24h' }
  );

  cookies.set('token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'none',  // Required for cross-site iframe (Telegram Mini App)
    secure: true,       // Required when sameSite is 'none' — always true in production
    maxAge: 60 * 60 * 24
  });

  return json({ ok: true });
}