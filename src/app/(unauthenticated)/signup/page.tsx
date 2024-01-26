'use client';

import {useRouter} from "next/navigation";
import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {fetchWithHandling, isErrorResponseBody} from "@/lib";
import {QRCodeSVG} from "qrcode.react";

/**
 * NEW_PASSWORD_REQUIRED: 新規パスワードを登録していない状態
 * MFA_SETUP: TOTPアプリを登録していない状態
 * SOFTWARE_TOKEN_MFA: ワンタイムトークンを入れればよい状態
 *
 * SUCCESS: TOTPアプリの登録に成功
 * ERROR: TOTPアプリの登録に失敗
 */
type ChallengeName = 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA' | 'NEW_PASSWORD_REQUIRED' | 'SUCCESS' | 'ERROR';

type ResponseBody = {
  nextStep?: ChallengeName;
  session?: string;
};

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmationPassword, setConfirmationPassword] = useState("");
  const [mfaCode, setMfaCode] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [nextStep, setNextStep] = useState<ChallengeName | undefined>(undefined);
  const [session, setSession] = useState<string | undefined>(undefined);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'tenantid') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'confirmationpassword') setConfirmationPassword(event.target.value);
    if (event.target.name === 'mfacode') setMfaCode(event.target.value);
  };

  const handleChangePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    try {
      const response = await fetchWithHandling<ResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/force-change-password`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          tenantId,
          email,
          password,
        })
      });

      if (isErrorResponseBody(response)) {
        setErrorMessage(response.error.message);
        return;
      }

      setNextStep(response.nextStep);
      setSession(response.session);
      setPassword('')
    } catch (error: unknown) {
      console.error(error);
    }
  }

  const handleNewPasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    try {
      const response = await fetchWithHandling<ResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/new-password-required`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          tenantId,
          email,
          password,
          session,
        })
      });

      if (isErrorResponseBody(response)) {
        setErrorMessage(response.error.message);
        return;
      }

      setNextStep(response.nextStep);
      setSession(response.session);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  const handleMfaVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    try {
      const response = await fetchWithHandling<ResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa-verify`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          mfaCode,
          session,
        })
      });

      if (isErrorResponseBody(response)) {
        setErrorMessage(response.error.message);
        return;
      }

      setNextStep(response.nextStep);
      setSession(response.session);
    } catch (error: unknown) {
      console.log(error);
    }
  }

  useEffect(() => {
    if (nextStep === 'SOFTWARE_TOKEN_MFA') {
      router.push('/signin');
    }

    (async () => {
      if (nextStep === 'MFA_SETUP') {
        setErrorMessage(undefined);

        const response = await fetchWithHandling<{
          session?: string;
          secretCode?: string;
        }>(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa-setup`, {
          headers: {
            'Content-Type': 'application/json',
          },
          method: 'POST',
          credentials: 'include',
          mode: 'cors',
          body: JSON.stringify({
            session
          })
        });

        if (isErrorResponseBody(response)) {
          setErrorMessage(response.error.message);
          return;
        }

        setQrCodeUrl(`otpauth://totp/${email}?secret=${response.secretCode}`)
        setSession(response.session);
      }
    })();
  }, [nextStep]);

  return (
    <div>
      <h1>SignUp</h1>
      <div>Step: {nextStep ?? 'FORCE_CHANGE_PASSWORD'}</div>

      { errorMessage && <div style={{color:'red'}}>ERROR: {errorMessage}</div>}

      {
        !nextStep && (
          <div>
            <form onSubmit={handleChangePasswordSubmit}>
              <div>
                tenantId: <input type="text" name="tenantid" value={tenantId} onChange={handleChange} />
              </div>
              <div>
                email: <input type="text" name="email" value={email} onChange={handleChange} />
              </div>
              <div>
                password: <input type="password" name="password" autoComplete="off" value={password} onChange={handleChange} />
              </div>
              <div>
                <button type="submit" value="submit">Submit</button>
              </div>
            </form>
          </div>
        )
      }

      {
        nextStep === 'NEW_PASSWORD_REQUIRED' && (
          <div>
            <form onSubmit={handleNewPasswordSubmit}>
              <div>
                password: <input type="password" name="password" autoComplete="new-password" value={password} onChange={handleChange} />
              </div>
              <div>
                password(confirmation): <input type="password" name="confirmationpassword" autoComplete="off" value={confirmationPassword} onChange={handleChange} />
              </div>
              <div>
                <button type="submit" value="submit">Submit</button>
              </div>
            </form>
          </div>
        )
      }

      {
        nextStep === 'MFA_SETUP' && qrCodeUrl && (
          <div>
            <QRCodeSVG value={qrCodeUrl} />
            <form onSubmit={handleMfaVerifySubmit}>
              <div>
                mfa_code: <input type="text" name="mfacode" value={mfaCode} onChange={handleChange} />
              </div>
              <div>
                <button type="submit" value="submit">Submit</button>
              </div>
            </form>
          </div>
        )
      }

      {
        nextStep === 'SOFTWARE_TOKEN_MFA' && (
          <div>
            <div>サインインページにリダイレクトします</div>
            <ul>
              <li>初回パスワード変更済み</li>
              <li>認証アプリケーション登録済み</li>
            </ul>
          </div>
        )
      }

      {
        nextStep === 'SUCCESS' && (
          <div>
            <div>ソフトウェア登録完了</div>
          </div>
        )
      }

      {
        nextStep === 'ERROR' && (
          <div>
            <div>認証フロー失敗</div>
          </div>
        )
      }
    </div>
  );
}