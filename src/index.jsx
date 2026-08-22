import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import '@ibm/plex-sans/css/ibm-plex-sans-default.css'
import '@ibm/plex-sans-condensed/css/ibm-plex-sans-condensed-default.css'
import '@ibm/plex-mono/css/ibm-plex-mono-default.css'
import './index.css'
import './themes/scaffold.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
