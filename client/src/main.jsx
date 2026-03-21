import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import './index.css'
import App from './App.jsx'
import { getToken } from './utils/authStorage.js'

// Production: set VITE_API_URL to your deployed Django origin (Render), no trailing slash.
const apiRoot = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
if (apiRoot) {
  axios.defaults.baseURL = apiRoot
} else if (import.meta.env.PROD) {
  console.error(
    "[FinNews] Public API URL (VITE_API_URL) is not set. Set it in your frontend project’s environment and redeploy, or API calls from this build will fail."
  )
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
