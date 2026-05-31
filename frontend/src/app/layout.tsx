import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Bright Smile Dental Clinic — Book Your Appointment Online',
  description:
    'Welcome to Bright Smile Dental Clinic. Book appointments online, access your dental records, and experience modern dental care in Addis Ababa, Ethiopia.',
  keywords: ['dentist', 'dental clinic', 'appointments', 'Addis Ababa', 'Ethiopia', 'dental care', 'teeth cleaning'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
