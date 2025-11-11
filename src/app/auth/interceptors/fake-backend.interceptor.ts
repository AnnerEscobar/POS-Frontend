import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse } from '@angular/common/http';
import { delay, of } from 'rxjs';

// ==== Helpers: cookies (solo para demo, NO producción) ====
function setCookie(name: string, value: string, days = 15, path = '/auth') {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${d.toUTCString()}; path=${path}; samesite=lax; secure`;
}
function getCookie(name: string) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
function deleteCookie(name: string, path = '/auth') {
  document.cookie = `${name}=; Max-Age=0; path=${path}`;
}

// ==== Helpers: tokens fake (solo para demo) ====
function base64url(obj: any) {
  return btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function makeAccessToken(minutes = 10) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'none', typ: 'JWT' }; // sin firma, SOLO DEMO
  const payload = {
    sub: 'user_demo',
    email: 'admin@demo.com',
    role: 'admin',
    iat: now,
    exp: now + minutes * 60,
    iss: 'https://fake.auth',
    aud: 'punto-de-venta-web',
  };
  return `${base64url(header)}.${base64url(payload)}.`; // formato JWT
}
function makeCsrf() {
  return crypto.randomUUID();
}
function makeRefresh() {
  return 'rt_' + crypto.randomUUID() + '_' + Date.now();
}

// ==== Respuestas helper ====
function ok<T>(body: T, ms = 500) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
}
function unauthorized(ms = 200) {
  return of(new HttpResponse({ status: 401, body: { message: 'Unauthorized' } })).pipe(delay(ms));
}
function badRequest(msg = 'Bad request', ms = 200) {
  return of(new HttpResponse({ status: 400, body: { message: msg } })).pipe(delay(ms));
}

export const fakeBackendInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const { url, method, body } = req;

  // Solo interceptamos nuestras rutas de auth demo
  const isAuthRoute = url.endsWith('/auth/login') || url.endsWith('/auth/refresh') || url.endsWith('/auth/logout');

  if (!isAuthRoute) {
    // dejar pasar lo demás (API reales/estáticas)
    return next(req);
  }

  // LOGIN
  if (url.endsWith('/auth/login') && method === 'POST') {
    const { email, password } = body || {};
    // Validación de demo (puedes cambiar credenciales)
    if (!email || !password) return badRequest('Email y contraseña requeridos');
    if (email !== 'admin@demo.com' || password !== '123456') {
      return unauthorized();
    }

    // emitir tokens
    const accessToken = makeAccessToken(10);
    const csrfToken = makeCsrf();
    const refresh = makeRefresh();

    // simular cookie de refresh (no HttpOnly en demo)
    setCookie('refreshToken', refresh);

    const user = { id: 'user_demo', email: 'admin@demo.com', role: 'admin', name: 'Admin Demo' };
    return ok({ accessToken, csrfToken, user });
  }

  // REFRESH
  if (url.endsWith('/auth/refresh') && method === 'POST') {
    const rt = getCookie('refreshToken');
    if (!rt) return unauthorized();

    // rotar refresh
    const newRt = makeRefresh();
    setCookie('refreshToken', newRt);

    const accessToken = makeAccessToken(10);
    const csrfToken = makeCsrf();
    return ok({ accessToken, csrfToken });
  }

  // LOGOUT
  if (url.endsWith('/auth/logout') && method === 'POST') {
    deleteCookie('refreshToken');
    return ok({ ok: true }, 150);
  }

  // fallback
  return next(req);
};
