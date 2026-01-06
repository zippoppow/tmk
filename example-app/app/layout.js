export const metadata = {
  title: 'Pegasus Component Library Example',
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
