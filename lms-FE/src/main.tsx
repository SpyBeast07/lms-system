import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './app/router';
import { QueryProvider } from './app/providers/QueryProvider';
import { AuthProvider } from './app/providers/AuthProvider';
import { DemoModeLayer, installDemoAdapter } from './features/demo';
import './index.css';

installDemoAdapter();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <DemoModeLayer />
      </AuthProvider>
    </QueryProvider>
  </React.StrictMode>
);
