import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppRouter } from './Router';
import './styles/globals.css';
import 'sonner/dist/styles.css';
import { Toaster } from 'sonner';
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId="680075148653-c7n7qrm66bsqohq8vqbv3ipi45iebfq6.apps.googleusercontent.com">
    <AppRouter />
    <Toaster position="top-right" richColors closeButton />
  </GoogleOAuthProvider>
);