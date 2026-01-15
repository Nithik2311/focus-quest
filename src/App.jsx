import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import CharacterCustomization from './pages/CharacterCustomization'
import FocusQuest from './pages/FocusQuest'
import Dashboard from './pages/Dashboard'
import { getFromStorage, STORAGE_KEYS } from './utils/storage'

import Navbar from './components/Navbar'

function App() {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isQuestActive, setIsQuestActive] = useState(false)

  useEffect(() => {
    // Check if user is logged in
    const savedUser = getFromStorage(STORAGE_KEYS.USER)
    if (savedUser) {
      setUser(savedUser)
    }
    setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-obsidian text-neon-blue">
        <div className="text-2xl animate-pulse">Initializing System...</div>
      </div>
    )
  }

  return (
    <Router>
      {user && !isQuestActive && <Navbar setUser={setUser} />}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" /> : <LandingPage setUser={setUser} />}
        />
        <Route
          path="/customize"
          element={user ? <CharacterCustomization /> : <Navigate to="/" />}
        />
        <Route
          path="/quest"
          element={user ? <FocusQuest setIsQuestActive={setIsQuestActive} /> : <Navigate to="/" />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  )
}

export default App
