import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { getToken } from './utils/authStorage.js'

// Production (e.g. Vercel): set VITE_API_URL to your deployed Django origin, no trailing slash.
const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
if (apiRoot) {
  axios.defaults.baseURL = apiRoot
}

axios.interceptors.request.use((config) => {
  const t = getToken()
  if (t) {
    config.headers.Authorization = `Token ${t}`
  }
  return config
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
