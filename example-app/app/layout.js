import { Lato } from 'next/font/google';
import Providers from './providers';

const lato = Lato({
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
  display: 'swap',
});

export const metadata = {
  title: 'The Morphology Kit® Admin',
  description: 'NextJS app consuming Pegasus Design System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={lato.className} style={{ margin: 0, padding: 0 }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
