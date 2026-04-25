import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';
import { error, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');
  const path = event.url.pathname.toLowerCase();

  const isValidateRoute = path.includes('/api/post/validate');
  const isCronRoute = path.startsWith('/api/cron/');

  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { user: App.Locals['user'] };
      event.locals.user = payload.user;
    } catch (err) {
      console.error("JWT Verification failed:", err);
      event.cookies.delete('token', { path: '/' });
    }
  }

  if (!event.locals.user && !isValidateRoute && !isCronRoute) {
    if (path.startsWith('/api')) {
      throw error(401, 'Unauthorized: Token required');
    }
  }

  const response = await resolve(event);

  // Allow Telegram WebView to embed the app
  response.headers.delete('X-Frame-Options');
  response.headers.set(
    'Content-Security-Policy',
    "frame-ancestors 'self' https://web.telegram.org https://*.telegram.org"
  );

  return response;
};