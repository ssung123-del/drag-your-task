import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV && window.location.hostname === '127.0.0.1') {
  const { port, pathname, search, hash } = window.location
  window.location.replace(`http://localhost:${port}${pathname}${search}${hash}`)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
