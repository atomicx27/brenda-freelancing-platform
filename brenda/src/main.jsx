import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/globals.css'

// Globally suppress debug console output in frontend (removes noisy debug prints)
// Remove or comment out this block if you need to re-enable logging.
['log','warn','info','debug','error'].forEach(m => {
  // Only override if the method exists
  if (typeof console[m] === 'function') {
    console[m] = () => {};
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
