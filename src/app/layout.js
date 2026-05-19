export const metadata = {
  title: 'Zamani Tours & Travels',
  description: 'Premium travel, visa, Umrah and forex services.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
