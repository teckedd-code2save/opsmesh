export const metadata = {
  title: 'OpsMesh — Gig Radar',
  description: 'Agent-native opportunity radar powered by OpenClaw.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif', background: '#020617', color: '#e2e8f0', WebkitFontSmoothing: 'antialiased' }}>
        {children}
      </body>
    </html>
  );
}
