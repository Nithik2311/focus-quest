import { motion } from 'framer-motion'
import CustomizableCharacter from './CustomizableCharacter'

const CharacterDisplay = ({ config, hp, state }) => {
  const isLowHP = hp < 30
  const isPenalizing = state === 'penalizing'
  const isWarning = state === 'warning'

  return (
    <div className="relative bg-purple-900/30 rounded-2xl p-8 border-2 border-purple-500 flex items-center justify-center min-h-[400px]">
      <motion.div
        animate={{
          scale: isLowHP ? [1, 1.05, 1] : 1,
          filter: isLowHP ? 'brightness(0.7)' : 'brightness(1)',
        }}
        transition={{
          duration: 1,
          repeat: isLowHP ? Infinity : 0,
        }}
        className="relative"
      >
        {/* Warning Glow */}
        {isWarning && (
          <motion.div
            className="absolute inset-0 bg-yellow-500 rounded-full opacity-30 blur-2xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Penalizing Glow */}
        {isPenalizing && (
          <motion.div
            className="absolute inset-0 bg-red-500 rounded-full opacity-40 blur-2xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          />
        )}

        <CustomizableCharacter config={config} />

        {/* HP Bar above character */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-32">
          <div className="w-full bg-purple-800 rounded-full h-3">
            <motion.div
              className={`h-3 rounded-full ${
                hp > 60 ? 'bg-green-500' : hp > 30 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              initial={{ width: `${hp}%` }}
              animate={{ width: `${hp}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CharacterDisplay
