'use client';

import { useRouter } from 'next/navigation';
import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {QRCodeSVG} from 'qrcode.react';

import {fetchWithHandling, isErrorResponseBody} from "@/lib";

type ChallengeName = 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA' | 'COMPLETE';

type SignInResponseBody = {
  nextStep?: ChallengeName;
  session?: string;
};

type ChallengeResponseBody = {
  nextStep?: ChallengeName;
}

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [nextStep, setNextStep] = useState<ChallengeName | undefined>(undefined);
  const [session, sesSession] = useState<string | undefined>(undefined);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'username') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'mfacode') setMfaCode(event.target.value);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetchWithHandling<SignInResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
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
      sesSession(response.session);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  const handleMfaSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetchWithHandling<ChallengeResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa-verification`, {
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
          mfaCode,
          session,
          nextStep
        })
      });

      if (isErrorResponseBody(response)) {
        setErrorMessage(response.error.message);
        return;
      }

      setNextStep(response.nextStep);
      sesSession(undefined);

      const url = new URL(decodeURIComponent(document.location.href));
      const callbackUrl = url.searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
    } catch (error: unknown) {
      console.log(error);
    }
  }

  useEffect(() => {
    (async () => {
      if (nextStep === 'MFA_SETUP') {
        const response = await fetchWithHandling<{
          session?: string;
          secretCode?: string;
        }>(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa`, {
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
        sesSession(response.session);
      }
    })();
  }, [nextStep]);

  return (
    <div>
      <h1>SignIn</h1>
      { errorMessage && <div style={{color:'red'}}>ERROR: {errorMessage}</div>}

      { !nextStep && (
          <div>
            <h2>1. Auth</h2>
            <form onSubmit={handleAuthSubmit}>
              <div>
                tenant_id: <input type="text" name="username" value={tenantId} onChange={handleChange} />
              </div>
              <div>
                email: <input type="text" name="email" value={email} onChange={handleChange} />
              </div>
              <div>
                password: <input type="password" name="password" value={password} onChange={handleChange} />
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
            <h2>2. MFA Setup</h2>
            <QRCodeSVG value={qrCodeUrl} />
            <form onSubmit={handleMfaSubmit}>
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
            <h2>3. MFA</h2>
            <form onSubmit={handleMfaSubmit}>
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
        nextStep === 'COMPLETE' && (
          <div>
            <h2>3. Complete</h2>
            <div>ホームにリダイレクトします</div>
          </div>
        )
      }
    </div>
  );
}