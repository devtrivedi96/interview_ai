import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Interview Prep Buddy',
  description: 'AI-powered mock interview platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
