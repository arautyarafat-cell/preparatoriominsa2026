import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Aplicar patch global do fetch para redirecionar URLs de localhost em produção
import { patchGlobalFetch } from './config/api';
patchGlobalFetch();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);