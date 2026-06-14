import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes } from 'react-router-dom';
import { type PropsWithChildren } from 'react';
import { queryClient } from './query-client';

export const RouterProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>{children}</Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};
