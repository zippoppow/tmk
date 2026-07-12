import { Lato } from 'next/font/google';
import Link from 'next/link';
import Providers from './providers';
import { Typography } from '@mui/material';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'The Morphology Kit® DIY: multicomponent lesson activity builder for morphology-based instruction',
  description: 'Tools and resources for creating your own morphology-based lesson activities based on The Morphology Kit® Framework.',
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
            <Stack
              direction="row"
              spacing={1.2}
              sx={{
                gridArea: 'sections',
                justifySelf: { xs: 'stretch', md: 'center' },
                justifyContent: { xs: 'stretch', md: 'center' },
                alignItems: 'center',
                minHeight: 40,
                '& > *': {
                  flex: { xs: 1, md: 'none' },
                },
              }}
            >
              <Typography>
                Copyright {currentYear} Sound Literacy Solutions LLC. All rights reserved.{' '}
              </Typography>
              <Typography>
                <Link href="/copyright" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>
                  Copyright Policy
                </Link>
              </Typography>
              <Typography>
                <Link href="/privacy" style={{ color: '#1d4ed8', textDecoration: 'none', fontWeight: 700 }}>
                  Privacy Statement
                </Link>
              </Typography>
            </Stack>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
