'use client';

import { useParams } from 'next/navigation';
import Home from '@/app/components/user/home';

export default function ChatPage() {
  const { id } = useParams();

  return <Home selectedChatId={id} />;
}