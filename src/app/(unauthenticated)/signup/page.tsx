'use client';

import {useRouter} from "next/navigation";
import {ChangeEvent, FormEvent, useEffect, useState} from "react";
import {fetchWithHandling, isErrorResponseBody} from "@/lib";
import {QRCodeSVG} from "qrcode.react";

type ChallengeName = 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA' | 'SUCCESS' | 'ERROR';

type ResponseBody = {
  session?: string;
}

type SignUpResponseBody = {
  nextStep?: ChallengeName;
  session?: string;
};

type VerifySoftwareTokenResponseBody = {
  nextStep?: ChallengeName;
  session?: string;
}

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [mfaCode, setMfaCode] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const [nextStep, setNextStep] = useState<ChallengeName | undefined>(undefined);
  const [session, sesSession] = useState<string | undefined>(undefined);

  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'tenantid') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'newpassword') setNewPassword(event.target.value);
    if (event.target.name === 'mfacode') setMfaCode(event.target.value);
  };

  const handleAuthSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetchWithHandling<SignUpResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          tenantId,
          email,
          currentPassword: password,
          newPassword
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
      const response = await fetchWithHandling<VerifySoftwareTokenResponseBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa-verification`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
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
      sesSession(response.session);
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
      <h1>SignUp</h1>

      { errorMessage && <div style={{color:'red'}}>ERROR: {errorMessage}</div>}

      <div>nextStep: {nextStep}</div>

      {
        !nextStep && (
          <div>
            <h2>1. Auth</h2>
            <form onSubmit={handleAuthSubmit}>
              <div>
                tenantId: <input type="text" name="tenantid" value={tenantId} onChange={handleChange} />
              </div>
              <div>
                email: <input type="text" name="email" value={email} onChange={handleChange} />
              </div>
              <div>
                password: <input type="password" name="password" value={password} onChange={handleChange} />
              </div>
              <div>
                new password: <input type="newpassword" name="newpassword" value={newPassword} onChange={handleChange} />
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
        nextStep === 'SUCCESS' && (
          <div>
            <h2>3. SUCCESS</h2>
            <div>ソフトウェア登録完了</div>
          </div>
        )
      }

      {
        nextStep === 'ERROR' && (
          <div>
            <h2>3. ERROR</h2>
            <div>認証フロー失敗</div>
          </div>
        )
      }
    </div>
  );
}