import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import CharacterSprite from './CharacterSprite'

const HeroSection = ({ onBeginQuest }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const heroRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect()
        setMousePosition({
          x: e.clientX - rect.left - rect.width / 2,
          y: e.clientY - rect.top - rect.height / 2,
        })
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section
      ref={heroRef}
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
    >
      {/* Hero Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="z-10 text-center px-4"
      >
        <motion.h1
          className="text-6xl md:text-8xl font-bold mb-4 bg-gradient-to-r from-neon-blue via-cyan-300 to-neon-blue bg-clip-text text-transparent drop-shadow-neon"
          animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
          transition={{ duration: 5, repeat: Infinity }}
          style={{ backgroundSize: "200% auto" }}
        >
          Focus Quest
        </motion.h1>
        <p className="text-xl md:text-2xl text-sky-200 mb-8 text-glow">
          Level Up Your Learning Journey
        </p>
      </motion.div>

      {/* Character Sprite with Eye Tracking */}
      <motion.div
        className="z-10 mb-8"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Glow behind character */}
        <div className="absolute inset-0 bg-neon-blue blur-[50px] opacity-20 rounded-full" />
        <CharacterSprite mousePosition={mousePosition} />
      </motion.div>

      {/* Begin Quest Button */}
      <motion.button
        onClick={onBeginQuest}
        className="z-10 px-10 py-5 bg-transparent border-2 border-neon-blue text-neon-blue rounded-full text-xl font-bold shadow-neon hover:shadow-neon-hover hover:bg-neon-blue hover:text-white transition-all duration-300 relative overflow-hidden group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="relative z-10">Begin Quest</span>
        <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
      </motion.button>
    </section>
  )
}

export default HeroSection
