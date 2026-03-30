'use client';
import { SessionProvider } from 'next-auth/react';
import SocketProvider from '@/app/components/providers/SocketProvider';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <SocketProvider>
        {children}
      </SocketProvider>
    </SessionProvider>
  );
}
