import { env } from '$env/dynamic/private';
import jwt from 'jsonwebtoken';
import { error, type Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get('token');
  const path = event.url.pathname;

  // 1. Define your "Free Pass" route
  // We use .toLowerCase() to stay safe against casing issues
  const isValidateRoute = path.toLowerCase().includes('/api/post/validate');

  // 2. Process token if it exists
  if (token) {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as { user: App.Locals['user'] };
      event.locals.user = payload.user;
    } catch (err) {
      console.error("JWT Verification failed:", err);
      event.cookies.delete('token', { path: '/' });
      // Even if the token is garbage, if they are hitting /validate, let them through
      // so they can get a NEW valid token.
    }
  }

  // 3. Strict Enforcement Logic
  if (!event.locals.user && !isValidateRoute) {
    /* We only throw error if:
       - User is NOT authenticated
       - AND they are NOT on the validate route
       - AND it's an API call or a data-sensitive page
    */
    if (path.toLowerCase().startsWith('/api')) {
      throw error(401, 'Unauthorized: Token required');
    }
    
    // Optional: Redirect to a landing page if it's a page request
    // throw redirect(307, '/welcome'); 
  }

  return await resolve(event);
};