import { Lato } from 'next/font/google';
import Link from 'next/link';
import Providers from './providers';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'The Morphology Kit® DIY',
  description: 'Tools and resources for teaching morphology.',
};

export default function RootLayout({ children }) {
  const currentYear = new Date().getFullYear();

  return (
    <html lang="en">
      <body className={lato.className} style={{ margin: 0, padding: 0, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <div style={{ flex: 1 }}>{children}</div>
          <footer
            style={{
              borderTop: '1px solid #dbe2f0',
              background: '#f8fafc',
              padding: '10px 16px',
              textAlign: 'center',
              fontSize: '0.9rem',
              color: '#334155',
            }}
          >
            <span>
              Copyright {currentYear} The Morphology Kit DIY. All rights reserved.{' '}
            </span>
            <Link href="/copyright" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>
              View Copyright Policy
            </Link>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
