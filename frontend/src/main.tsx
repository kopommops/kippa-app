import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { PwaInstallPrompt } from './PwaInstallPrompt'
import { registerPeloServiceWorker } from './pwa'
import './index.css'
import './pwa-install.css'

registerPeloServiceWorker()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <>
      <App />
      <PwaInstallPrompt />
    </>
  </React.StrictMode>,
)
