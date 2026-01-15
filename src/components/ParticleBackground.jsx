import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const ParticleBackground = () => {
    const [particles, setParticles] = useState([])

    useEffect(() => {
        // Create random particles
        const particleCount = 20
        const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 20 + 5,
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5,
        }))
        setParticles(newParticles)
    }, [])

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Dynamic Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-neon-blue mix-blend-screen blur-sm"
                    style={{
                        left: `${particle.x}%`,
                        top: `${particle.y}%`,
                        width: particle.size,
                        height: particle.size,
                        opacity: 0.2,
                    }}
                    animate={{
                        y: [0, -100, 0],
                        x: [0, 50, 0],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: "easeInOut",
                    }}
                />
            ))}

            {/* Geometric Floating Shapes */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-32 h-32 border-2 border-neon-blue rounded-xl opacity-20"
                animate={{
                    rotate: 360,
                    y: [0, 50, 0],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                }}
            />

            <motion.div
                className="absolute bottom-1/3 right-1/4 w-48 h-48 border border-neon-cyan rounded-full opacity-10"
                animate={{
                    scale: [1, 1.2, 1],
                    x: [0, -30, 0],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-transparent to-transparent opacity-80" />
        </div>
    )
}

export default ParticleBackground
