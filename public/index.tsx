import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';

/**
 * Entry point for the Marketing AI Pro application.
 * This file handles the initial rendering of the React application.
 */

const rootElement = document.getElementById('root');

if (!rootElement) {
  // A critical error that prevents the app from starting.
  throw new Error("Fatal Error: The root element with ID 'root' was not found in the DOM.");
}

const root = ReactDOM.createRoot(rootElement);

// Render the main application component within React's StrictMode
// to highlight potential problems in the app during development.
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);