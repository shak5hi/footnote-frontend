import './globals.css';
import LenisProvider from '@/components/LenisProvider';

export const metadata = {
  title: 'Footnote — Architecture of Sound',
  description: 'An editorial reading companion. For those who think in long-form.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
