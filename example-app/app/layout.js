export const metadata = {
  title: 'The Morphology Kit® Admin',
  description: 'NextJS app consuming Pegasus Design System',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}
