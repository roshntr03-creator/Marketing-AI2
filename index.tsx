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

// A self-contained component to display critical rendering errors without external dependencies.
const ErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div style={{
    fontFamily: 'sans-serif',
    textAlign: 'center',
    padding: '40px 20px',
    color: '#c53030',
    backgroundColor: '#fff5f5',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Application Error</h1>
    <p style={{ fontSize: '16px', marginBottom: '30px' }}>Something went wrong and the app could not start.</p>
    <pre style={{
      backgroundColor: '#fed7d7',
      padding: '15px',
      borderRadius: '8px',
      maxWidth: '800px',
      overflowX: 'auto',
      textAlign: 'left',
      whiteSpace: 'pre-wrap',
      wordWrap: 'break-word',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      <strong>{error.name}: {error.message}</strong>
      {error.stack && `\n\n${error.stack}`}
    </pre>
  </div>
);


try {
  // Render the main application component within React's StrictMode
  // to highlight potential problems in the app during development.
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  console.error("A critical error occurred during the initial render:", error);
  // If rendering the main app fails, render a fallback UI with the error.
  if (error instanceof Error) {
    root.render(<ErrorFallback error={error} />);
  } else {
    // Fallback for non-Error objects being thrown.
    root.render(<ErrorFallback error={new Error(String(error))} />);
  }
}
