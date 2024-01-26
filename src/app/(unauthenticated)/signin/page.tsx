'use client';

import { useRouter } from 'next/navigation';
import {ChangeEvent, FormEvent, useEffect, useState} from "react";

import {fetchWithHandling, isErrorResponseBody} from "@/lib";

type ChallengeName = 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA' | 'SUCCESS' | 'ERROR';

type ResponseBody = {
  nextStep?: ChallengeName;
  session?: string;
};

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState('');

  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  const [nextStep, setNextStep] = useState<ChallengeName | undefined>(undefined);
  const [session, sesSession] = useState<string | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'username') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'mfacode') setMfaCode(event.target.value);
  };

  const handleSignInSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    try {
      const response = await fetchWithHandling<ResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
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

  const handleMfaVerifySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(undefined);

    try {
      const response = await fetchWithHandling<ResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/software-token-mfa`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          tenantId,
          email,
          session,
          mfaCode,
        })
      });

      if (isErrorResponseBody(response)) {
        setErrorMessage(response.error.message);
        // セッション認証がきれた場合
        if (response.error.name === 'NotAuthorizedException') {
          sesSession(undefined);
          setNextStep(undefined);
          setMfaCode('')
        }
        return;
      }

      setNextStep(response.nextStep);
      sesSession(response.session);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  useEffect(() => {
    // TODO なぜかリダイレクトされない？
    if (nextStep === 'SUCCESS') {
      router.push('/');
    }
  }, [nextStep]);

  return (
    <div>
      <h1>SignIn</h1>
      <div>Step: {nextStep ?? 'USER_PASSWORD_AUTH'}</div>

      { errorMessage && <div style={{color:'red'}}>ERROR: {errorMessage}</div>}

      {
        !nextStep && (
          <div>
            <form onSubmit={handleSignInSubmit}>
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
        nextStep === 'SOFTWARE_TOKEN_MFA' && (
          <div>
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
        nextStep === 'SUCCESS' && (
          <div>
            <div>ホームにリダイレクトします</div>
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