'use client';

import {fetchWithHandling} from "@/lib";

type PageProps = {
  searchParams: {
    session?: string;
  }
};

export default function Page({ searchParams }: PageProps) {
  const response = fetchWithHandling(`${process.env.NEXT_PUBLIC_API_URL}/auth/mfa`, {
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    credentials: 'include',
    mode: 'cors',
    body: JSON.stringify({
      session: searchParams.session
    })
  });

  return (
    <div>
      <h1>MFA</h1>
      <div>session={`${searchParams.session}`}</div>
    </div>
  );
}