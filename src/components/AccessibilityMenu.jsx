import { useState, useEffect } from 'react'
import './AccessibilityMenu.css'

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [highContrast, setHighContrast] = useState(false)
  const [dyslexicFont, setDyslexicFont] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const saved = {
      darkMode: localStorage.getItem('a11y-dark-mode') === 'true',
      highContrast: localStorage.getItem('a11y-high-contrast') === 'true',
      dyslexicFont: localStorage.getItem('a11y-dyslexic-font') === 'true',
    }
    setDarkMode(saved.darkMode)
    setHighContrast(saved.highContrast)
    setDyslexicFont(saved.dyslexicFont)
    applySettings(saved)
  }, [])

  function applySettings(settings) {
    const html = document.documentElement
    html.classList.toggle('dark-mode', settings.darkMode)
    html.classList.toggle('high-contrast', settings.highContrast)
    html.classList.toggle('dyslexic-font', settings.dyslexicFont)
  }

  function toggleDarkMode() {
    const newValue = !darkMode
    setDarkMode(newValue)
    localStorage.setItem('a11y-dark-mode', newValue)
    applySettings({ darkMode: newValue, highContrast, dyslexicFont })
  }

  function toggleHighContrast() {
    const newValue = !highContrast
    setHighContrast(newValue)
    localStorage.setItem('a11y-high-contrast', newValue)
    applySettings({ darkMode, highContrast: newValue, dyslexicFont })
  }

  function toggleDyslexicFont() {
    const newValue = !dyslexicFont
    setDyslexicFont(newValue)
    localStorage.setItem('a11y-dyslexic-font', newValue)
    applySettings({ darkMode, highContrast, dyslexicFont: newValue })
  }

  return (
    <div className="accessibility-menu">
      <button
        className="a11y-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Accessibility settings"
        title="Accessibility settings"
      >
        ♿
      </button>

      {isOpen && (
        <div className="a11y-panel">
          <h3>Accessibility</h3>

          <label className="a11y-option">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              aria-label="Toggle dark mode"
            />
            <span>🌙 Dark Mode</span>
          </label>

          <label className="a11y-option">
            <input
              type="checkbox"
              checked={highContrast}
              onChange={toggleHighContrast}
              aria-label="Toggle high contrast"
            />
            <span>⚡ High Contrast</span>
          </label>

          <label className="a11y-option">
            <input
              type="checkbox"
              checked={dyslexicFont}
              onChange={toggleDyslexicFont}
              aria-label="Toggle dyslexic-friendly font"
            />
            <span>Aa Dyslexic Font</span>
          </label>

          <button
            className="a11y-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close accessibility menu"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
