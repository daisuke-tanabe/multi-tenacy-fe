'use client';

import { useRouter } from 'next/navigation';
import {ChangeEvent, FormEvent, useState} from "react";
import {QRCodeSVG} from 'qrcode.react';

import {fetchWithHandling, isErrorResponse} from "@/lib";

type ChallengeName = 'MFA_SETUP' | 'SOFTWARE_TOKEN_MFA';

type ResBody = {
  id: string;
};

type NextStepResBody = {
  challengeName: ChallengeName;
  qrCodeUrl?: string;
  session?: string;
};

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [challengeName, setChallengeName] = useState<ChallengeName | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | undefined>(undefined);
  const [mfaCode, setMfaCode] = useState<string>('');
  const [challengeSession, setChallengeSession] = useState<string | undefined>(undefined);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'username') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'mfacode') setMfaCode(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      const response = await fetchWithHandling<ResBody | NextStepResBody>(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
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
          ...(challengeName　&& { nextStep: challengeName }),
          ...(mfaCode && { mfaCode }),
          ...(challengeSession && { session: challengeSession })
        })
      });

      if (isErrorResponse(response)) {
        console.log(response.error.message);
        return;
      }

      if ('challengeName' in response && response.challengeName === 'MFA_SETUP') {
        setChallengeName(response.challengeName);
        setQrCodeUrl(response.qrCodeUrl);
        setChallengeSession(response.session);
        return;
      }

      if ('challengeName' in response && response.challengeName === 'SOFTWARE_TOKEN_MFA') {
        setChallengeName(response.challengeName);
        return;
      }

      const url = new URL(decodeURIComponent(document.location.href));
      const callbackUrl = url.searchParams.get('callbackUrl') || '/';
      router.push(callbackUrl);
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>signin</h1>
      <form onSubmit={handleSubmit}>
        { challengeName !== 'MFA_SETUP' && challengeName !== 'SOFTWARE_TOKEN_MFA' && (
          <>
            <div>
              tenant_id: <input type="text" name="username" value={tenantId} onChange={handleChange} />
            </div>
            <div>
              email: <input type="text" name="email" value={email} onChange={handleChange} />
            </div>
            <div>
              password: <input type="password" name="password" value={password} onChange={handleChange} />
            </div>
          </>
        )
      }

        {
          challengeName === 'MFA_SETUP' && qrCodeUrl && (
            <div>
              <QRCodeSVG value={qrCodeUrl} />
              <div>
                mfa_code: <input type="text" name="mfacode" value={mfaCode} onChange={handleChange} />
              </div>
            </div>
          )
        }

        {
          challengeName === 'SOFTWARE_TOKEN_MFA' && (
            <div>
              mfa_code: <input type="text" name="mfacode" value={mfaCode} onChange={handleChange} />
            </div>
          )
        }

        <div>
          <button type="submit" value="submit">Submit</button>
        </div>
      </form>
    </div>
  );
}