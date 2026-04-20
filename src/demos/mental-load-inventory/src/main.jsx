import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Shim window.storage to use localStorage (the original code expects this API)
window.storage = {
  async get(key) {
    const value = localStorage.getItem(key);
    return value !== null ? { value } : null;
  },
  async set(key, value) {
    localStorage.setItem(key, value);
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
