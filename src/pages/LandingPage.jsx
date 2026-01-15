import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import HeroSection from '../components/HeroSection'
import DigitalScroll from '../components/MagicScroll' // Keeping file name, changed export
import AuthModal from '../components/AuthModal'
import ParticleBackground from '../components/ParticleBackground'

import ClockBackground from '../components/ClockBackground' // Import new component

const LandingPage = ({ setUser }) => {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const navigate = useNavigate()

  const handleBeginQuest = () => {
    setShowAuthModal(true)
  }

  const handleAuthSuccess = (userData) => {
    setUser(userData)
    setShowAuthModal(false)
    navigate('/customize')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ClockBackground /> {/* Clock behind particles */}
      <ParticleBackground />
      <div className="relative z-10">
        <HeroSection onBeginQuest={handleBeginQuest} />
        <DigitalScroll />
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
        />
      </div>
    </div>
  )
}

export default LandingPage
