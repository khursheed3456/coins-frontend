import '../styles/globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'CoinX444 - Trade Smarter',
  description: 'The fastest growing crypto trading platform in Pakistan',
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#0d1423',
              color: '#e8f0fe',
              border: '1px solid #1e2a3a',
              fontFamily: 'Inter, sans-serif',
            },
            success: {
              iconTheme: { primary: '#00e676', secondary: '#0d1423' },
            },
            error: {
              iconTheme: { primary: '#ff1744', secondary: '#0d1423' },
            },
          }}
        />
      </body>
    </html>
  );
}
