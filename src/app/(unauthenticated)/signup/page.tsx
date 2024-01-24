'use client';

import {useRouter} from "next/navigation";
import {ChangeEvent, FormEvent, useState} from "react";
import {fetchWithHandling} from "@/lib";

export default function Page() {
  const router = useRouter();

  const [tenantId, setTenantId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'tenantid') setTenantId(event.target.value);
    if (event.target.name === 'email') setEmail(event.target.value);
    if (event.target.name === 'password') setPassword(event.target.value);
    if (event.target.name === 'newpassword') setNewPassword(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await fetchWithHandling(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
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

      await fetchWithHandling(`${process.env.NEXT_PUBLIC_API_URL}/auth/signin`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          tenantId,
          email,
          password: newPassword
        })
      });

      router.push('/');
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <div>
      <h1>signup</h1>
      <form onSubmit={handleSubmit}>
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
  );
}