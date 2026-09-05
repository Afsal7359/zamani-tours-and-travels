export const metadata = {
  title: 'Zamani Tours & Travels',
  description: 'Premium travel, visa, Umrah and forex services.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/logoloading.mp4" as="video" type="video/mp4" fetchPriority="high" />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
