import { motion } from 'framer-motion'

const ClockBackground = () => {
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 flex items-center justify-center opacity-20">
            {/* Main Clock Container */}
            <div className="relative w-[80vh] h-[80vh] max-w-[800px] max-h-[800px]">

                {/* Outer Ring - Static or Slow Rotate */}
                <motion.div
                    className="absolute inset-0 rounded-full border-4 border-neon-blue opacity-30 box-glow"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
                />

                {/* Inner Ticks Ring */}
                <motion.div
                    className="absolute inset-4 rounded-full border-2 border-dashed border-neon-cyan opacity-20"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
                />

                {/* Hour Hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-2 h-1/3 bg-white origin-bottom rounded-full shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                    style={{ x: '-50%', y: '-100%' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                />

                {/* Minute Hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-1 h-2/5 bg-neon-cyan origin-bottom rounded-full"
                    style={{ x: '-50%', y: '-100%' }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />

                {/* Second Hand */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-0.5 h-1/2 bg-neon-purple origin-bottom"
                    style={{ x: '-50%', y: '-100%', backgroundColor: '#d946ef' }} // pink/purple
                    animate={{ rotate: 360 }}
                    transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                />

                {/* Center Point */}
                <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2 shadow-neon" />

                {/* Pulse Effect */}
                <motion.div
                    className="absolute top-1/2 left-1/2 w-full h-full rounded-full border border-neon-blue origin-center"
                    style={{ x: '-50%', y: '-50%' }}
                    animate={{ scale: [0.9, 1.1, 0.9], opacity: [0.1, 0.2, 0.1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>
        </div>
    )
}

export default ClockBackground
