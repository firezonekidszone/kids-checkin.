'use client';
import { useEffect } from 'react';

export default function RootLayout({ children }:{ children: React.ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/service-worker.js').catch(()=>{});
    }
  }, []);
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body style={{margin:0,fontFamily:'-apple-system, Arial, sans-serif'}}>{children}</body>
    </html>
  );
}