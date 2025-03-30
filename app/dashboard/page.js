'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return (
      <div>
        <h1>You are not logged in</h1>
        <Link href="/login">Login</Link>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <h1>Welcome, {session.user.name}!</h1>
      <p>Your email: {session.user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
