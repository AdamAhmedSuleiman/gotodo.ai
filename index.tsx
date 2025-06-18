

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App.js'; // Corrected path based on project structure

console.log("[GoToDo] index.tsx: Script start");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[GoToDo] index.tsx: Root element not found!");
  throw new Error("Could not find root element to mount to");
}
console.log("[GoToDo] index.tsx: Root element found.");

const root = ReactDOM.createRoot(rootElement);
console.log("[GoToDo] index.tsx: ReactDOM root created. Attempting to render App...");

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log("[GoToDo] index.tsx: ReactDOM.render called. Script end.");