import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Frost Flight | Ski Jump Challenge',
  description: 'Guess the number, watch Uncle Austen fly, and see how you rank on the global leaderboard (aka the ssx groupchats).',};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
