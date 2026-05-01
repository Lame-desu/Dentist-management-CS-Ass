import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'DAMS — Dentist Appointments & Management System',
  description:
    'A comprehensive web-based platform for Ethiopian private dental clinics. Manage appointments, dental records, prescriptions, queue management, and notifications.',
  keywords: ['dentist', 'appointments', 'dental clinic', 'management system', 'Ethiopia'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
