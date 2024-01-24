import {fetchWithHandling} from "@/lib";
import {cookies} from "next/headers";

export default async function Page() {
  const cookieStore = cookies();
  const session = cookieStore.get('session');

  const response = await fetchWithHandling<{ message: string}>(`${process.env.NEXT_PUBLIC_API_URL}/protect`, {
    headers: {
      'Content-Type': 'application/json',
      cookie: `${session?.name}=${session?.value}`,
    },
    method: 'GET',
    credentials: 'include',
    mode: 'cors',
    cache: 'no-store',
  });

  return (
    <>
      <h1>HOME</h1>
      <div>{response.message}</div>
    </>
  );
}