import { CognitoJwtVerifier } from 'aws-jwt-verify';
import {NextRequest, NextResponse} from "next/server";
import {CognitoIdTokenPayload} from "aws-jwt-verify/jwt-model";
import {jwtDecode} from "jwt-decode";

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};

export default async function middleware(request: NextRequest) {
  const { next, redirect } = NextResponse;
  const { pathname } = request.nextUrl;
  const isFromSignIn = pathname === '/signin';
  const isFromSignUp = pathname === '/signup';
  const isMFA = pathname === '/mfa';

  const session = request.cookies.get('session');

  if (!session) {
    if (!isFromSignUp && !isFromSignIn && !isMFA) return redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL));
    return next();
  }

  try {
    const jwt = session.value;
    const jwtPayload: CognitoIdTokenPayload = jwtDecode(session.value);
    // TODO 超適当
    const userPoolId = jwtPayload.iss.replace('https://cognito-idp.ap-northeast-1.amazonaws.com/', '');
    const clientId = jwtPayload.aud;
    const verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
    await verifier.verify(jwt);

    // トークンが有効ならサインインしていてもトップ画面に戻せるようにしておく
    if (isFromSignIn) return redirect(new URL('/', process.env.NEXT_PUBLIC_SITE_URL));
  } catch {
    // これのやっている意図は特定のURLはトークン検証をしなくても見えるようにしたいから
    const whiteListPathNames = ['/signin', '/signup'];
    const hasPathName = whiteListPathNames.some((value) => value === pathname);
    if (hasPathName) return next();
    return redirect(new URL('/signin', process.env.NEXT_PUBLIC_SITE_URL));
  }

  return next();
}