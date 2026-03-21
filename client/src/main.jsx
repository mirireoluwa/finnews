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
    '[FinNews] VITE_API_URL is missing. Login/API calls will fail. Add it in your frontend host (e.g. Vercel → Environment Variables) ' +
      'to your Render API URL, then redeploy. Example: https://finnews-api.onrender.com'
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
