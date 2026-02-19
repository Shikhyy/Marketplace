import type { Metadata } from 'next';
import { Outfit, Newsreader } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Navbar from '@/components/Navbar';

const font = Outfit({ subsets: ['latin'], variable: '--font-sans' });
const serif = Newsreader({ subsets: ['latin'], style: 'italic', variable: '--font-serif' });

export const metadata: Metadata = {
  title: 'ContentHub x402',
  description: 'Decentralized Content Subscription Marketplace',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${font.variable} ${serif.variable} font-sans bg-slate-950 text-slate-100 min-h-screen`} suppressHydrationWarning>
        <Providers>
          <Navbar />

          {/* Global Background Effects - Moved from page.tsx for consistency */}
          <div className="fixed inset-0 bg-slate-950 -z-50" />
          <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-40 pointer-events-none masking-gradient" />
          <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -z-40 opacity-40 pointer-events-none mix-blend-screen" />

          <main className="pt-32 pb-20 relative z-10 flex-grow">
            {children}
          </main>
        </Providers>
      </body>
    </html >
  );
}
