import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CareerOS — Career Intelligence Platform',
  description: 'Paste your LinkedIn URL and get a real-time AI-powered career analysis dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {children}
    </html>
  );
}
