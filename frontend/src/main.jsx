import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { StellarWalletsKit } from '@creit-tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils'
import './index.css'
import App from './App.jsx'
import { initMonitoring } from './lib/monitoring'

// Initialize Stellar Wallets Kit once at app startup
StellarWalletsKit.init({ modules: defaultModules() })
initMonitoring()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
