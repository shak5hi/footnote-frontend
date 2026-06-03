'use client';

import { useEffect } from 'react';

export default function LoginPage() {
  useEffect(() => {
    window.location.href = 'http://localhost:5173/login.html';
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: '#F0E0D6',
      color: '#330C16',
      fontFamily: 'monospace',
      letterSpacing: '0.1em'
    }}>
      Redirecting to login...
    </div>
  );
}

