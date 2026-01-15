import { motion } from 'framer-motion'

const SpeechBubble = ({ message }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.8 }}
      className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white text-quest-dark rounded-lg p-4 shadow-2xl max-w-xs z-10"
      style={{
        filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))',
      }}
    >
      <div className="text-sm font-bold text-center text-slate-900">{message}</div>
      {/* Speech bubble tail */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
        <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
      </div>
    </motion.div>
  )
}

export default SpeechBubble
