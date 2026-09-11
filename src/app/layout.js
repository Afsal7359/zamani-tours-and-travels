import { Fraunces, Manrope } from 'next/font/google';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Zamani Tours & Travels — Premium Travel, Visa, Umrah & Forex',
    template: '%s | Zamani Tours & Travels',
  },
  description: 'Your trusted single desk in Kerala for flights, worldwide visas, Umrah packages, international holiday packages, GCC job visas, and forex services.',
  icons: {
    icon: '/images/zamaniLogo.svg',
    apple: '/images/zamaniLogo.png',
  },
  openGraph: {
    title: 'Zamani Tours & Travels',
    description: 'Premium travel, visa, Umrah, and forex services.',
    siteName: 'Zamani Tours & Travels',
    locale: 'en_IN',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#050B26',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${manrope.variable}`}>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
