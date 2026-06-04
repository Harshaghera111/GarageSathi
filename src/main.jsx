/**
 * Application Entry Point — GarageSathi
 *
 * Mounts the React app to the DOM.
 * Imports global styles (TailwindCSS).
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
