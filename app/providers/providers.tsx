// app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  // Create the client instance ONLY ONCE per component lifecycle using useState.
  const [queryClient] = React.useState(() => new QueryClient());

  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}