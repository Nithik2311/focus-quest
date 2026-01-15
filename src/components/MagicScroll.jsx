import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'

const DigitalScroll = () => {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [activeSegment, setActiveSegment] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight
      const scrollPosition = window.scrollY
      const documentHeight = document.documentElement.scrollHeight - windowHeight
      const progress = Math.min(100, (scrollPosition / documentHeight) * 100)
      setScrollProgress(progress)

      // Determine active segment for highlights
      if (progress < 30) setActiveSegment(0)
      else if (progress < 70) setActiveSegment(1)
      else setActiveSegment(2)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollUnroll = Math.min(100, scrollProgress * 2.5)

  return (
    <section className="min-h-screen py-20 px-4 flex flex-col items-center justify-center relative z-20">
      <div className="relative w-full max-w-5xl z-10 flex gap-8">

        {/* Left Side: Data Stream Indicator */}
        <div className="hidden md:flex flex-col items-center justify-center w-16 sticky top-20 h-96">
          <div className="w-1 h-full bg-slate-800 rounded-full relative overflow-hidden">
            <motion.div
              className="absolute top-0 w-full bg-neon-blue shadow-[0_0_10px_#0ea5e9]"
              style={{ height: `${scrollProgress}%` }}
            />
          </div>
          <div className="mt-4 text-xs font-mono text-neon-blue rotate-90 whitespace-nowrap">
            SYS.PROGRESS: {Math.round(scrollProgress)}%
          </div>
        </div>

        {/* Main Interface: Holographic Container */}
        <div className="flex-1 relative">
          {/* Holo Frame */}
          <div className="absolute -inset-4 border border-neon-blue/30 rounded-2xl pointer-events-none">
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-neon-blue" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-neon-blue" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-neon-blue" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-neon-blue" />
          </div>

          <motion.div
            className="bg-obsidian/90 backdrop-blur-xl rounded-xl shadow-[0_0_30px_rgba(14,165,233,0.15)] p-8 md:p-12 border border-neon-blue/50 relative overflow-hidden"
            style={{
              clipPath: `inset(${100 - scrollUnroll}% 0% 0% 0%)`,
            }}
          >
            {/* Scanline Effect */}
            <div className="absolute inset-0 bg-repeat-y opacity-5 pointer-events-none" style={{ backgroundImage: 'linear-gradient(transparent 50%, rgba(14, 165, 233, 0.2) 50%)', backgroundSize: '100% 4px' }} />

            {/* Content */}
            <div className="relative z-10 space-y-12">

              {/* Header */}
              <div className="text-center border-b border-neon-blue/30 pb-8">
                <h2 className="text-4xl md:text-6xl font-black mb-2 text-white tracking-tight drop-shadow-neon">
                  PROTOCOL <span className="text-neon-blue">INITIATED</span>
                </h2>
                <div className="text-sky-400 font-mono text-sm tracking-widest">
                  SYSTEM VERSION 2.0 // POMODORO INTEGRATION
                </div>
              </div>

              {/* Grid of Info */}
              <div className="grid md:grid-cols-2 gap-8">

                {/* Module 1 */}
                <motion.div
                  className={`p-6 border rounded-lg transition-all duration-500 ${activeSegment === 0 ? 'border-neon-blue bg-neon-blue/5 shadow-neon' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">⏱️</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 font-mono">UPLOAD PHASE</h3>
                      <p className="text-sky-200/80 text-sm leading-relaxed">
                        Execute <strong className="text-neon-blue">25-minute</strong> high-intensity focus blocks.
                        Your neural link (Attention) must remain active.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Module 2 */}
                <motion.div
                  className={`p-6 border rounded-lg transition-all duration-500 ${activeSegment === 0 ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_10px_#06b6d4]' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">🔋</div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2 font-mono">RECHARGE CYCLE</h3>
                      <p className="text-sky-200/80 text-sm leading-relaxed">
                        Mandatory <strong className="text-neon-cyan">5-minute</strong> cooldowns required to prevent system overheat.
                        HP regeneration occurs during rest.
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Module 3 (Full Width) */}
                <motion.div
                  className={`md:col-span-2 p-6 border rounded-lg transition-all duration-500 ${activeSegment >= 1 ? 'border-red-500 bg-red-900/10 shadow-[0_0_15px_rgba(239,68,68,0.4)]' : 'border-slate-800 bg-slate-900/50 opacity-60'}`}
                >
                  <div className="flex items-center gap-6">
                    <div className="text-5xl animate-pulse">⚠️</div>
                    <div>
                      <h3 className="text-xl font-bold text-red-500 mb-2 font-mono">CRITICAL WARNING</h3>
                      <p className="text-red-200/80 text-sm leading-relaxed">
                        Disconnection from the interface (Tab Switching) triggers a <strong className="text-white">5-second fail-safe</strong>.
                        Continued absence results in permanent HP data loss.
                      </p>
                    </div>
                  </div>
                </motion.div>

              </div>

            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default DigitalScroll
