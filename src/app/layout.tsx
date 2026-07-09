import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DataRola — AI Data-Analyst Agent for Small Teams',
  description:
    'Connect your spreadsheets and data warehouses. Ask business questions in plain English. Get instant answers, proactive anomaly alerts — no SQL required.',
  keywords: [
    'AI analyst',
    'data analytics',
    'text-to-SQL',
    'anomaly detection',
    'spreadsheet analytics',
    'small business data',
  ],
  openGraph: {
    title: 'DataRola — AI Data-Analyst Agent',
    description:
      'An analyst in a box for small teams. Connect your data. Ask questions in plain English.',
    type: 'website',
    locale: 'en_US',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
