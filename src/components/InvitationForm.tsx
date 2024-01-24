'use client';

import {ChangeEvent, FormEvent, useState} from "react";
import {fetchWithHandling} from "@/lib";

export function InvitationForm() {
  const [email, setEmail] = useState("");

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.name === 'email') setEmail(event.target.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      await fetchWithHandling(`${process.env.NEXT_PUBLIC_API_URL}/invite`, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        credentials: 'include',
        mode: 'cors',
        body: JSON.stringify({
          email,
        })
      });
    } catch (error: unknown) {
      console.error(error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        email: <input type="text" name="email" value={email} onChange={handleChange} />
      </div>
      <div>
        <button type="submit" value="submit">Submit</button>
      </div>
    </form>
  );
}