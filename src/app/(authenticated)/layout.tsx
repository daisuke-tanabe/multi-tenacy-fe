import {PropsWithChildren} from "react";
import NextLink from "next/link";

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div>
      <header style={{ background: "black", color: 'white', padding: 12, textAlign: 'center' }}>header</header>
      <nav>
        <ul>
          <li>
            <NextLink href="/">Home</NextLink>
          </li>
          <li>
            <NextLink href="/invitation">Invitation</NextLink>
          </li>
        </ul>
      </nav>
      <main>{children}</main>
    </div>
  )
}