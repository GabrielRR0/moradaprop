import type { Metadata } from 'next';
import { LoginPage } from '@/modules/auth';

export const metadata: Metadata = { title: 'Ingresar' };

export default async function Page({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return <LoginPage next={next} />;
}
