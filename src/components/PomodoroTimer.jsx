import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { FOCUS_STATES } from '../utils/focusStateMachine'

const DEFAULT_WORK_DURATION = 25 * 60
const DEFAULT_BREAK_DURATION = 5 * 60
const WARNING_TIME = 2 * 60

const PomodoroTimer = ({
  focusState,
  onCycleComplete,
  onBreakEnd,
  onWarningAlert,
  workDuration = DEFAULT_WORK_DURATION,
  breakDuration = DEFAULT_BREAK_DURATION
}) => {
  const [timeLeft, setTimeLeft] = useState(workDuration)
  const [isRunning, setIsRunning] = useState(false)
  const [isWorkPhase, setIsWorkPhase] = useState(true)
  const [hasWarned, setHasWarned] = useState(false)
  const intervalRef = useRef(null)
  const warningTriggeredRef = useRef(false)

  // Sync timeLeft when durations change or state resets
  useEffect(() => {
    if (!isRunning && focusState === FOCUS_STATES.IDLE) {
      setTimeLeft(workDuration)
    }
  }, [workDuration, isRunning, focusState])

  useEffect(() => {
    if (focusState === FOCUS_STATES.FOCUSING && !isRunning) {
      setIsRunning(true)
      setIsWorkPhase(true)
      setTimeLeft(workDuration)
      setHasWarned(false)
      warningTriggeredRef.current = false
    } else if (focusState === FOCUS_STATES.BREAKING && isWorkPhase) {
      setIsWorkPhase(false)
      setTimeLeft(breakDuration)
      setHasWarned(false)
      warningTriggeredRef.current = false
    } else if (focusState === FOCUS_STATES.IDLE) {
      setIsRunning(false)
      setTimeLeft(workDuration)
      setIsWorkPhase(true)
      setHasWarned(false)
      warningTriggeredRef.current = false
    }
  }, [focusState])

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1

          // 1 MINUTE WARNING
          if (isWorkPhase && newTime === 60) {
            onWarningAlert("Only 1 minute left! Finish strong, hero!")
          }

          // BREAK PHASE ALERTS - Trigger at start (max duration) and mid-way
          if (!isWorkPhase) {
            if (newTime === breakDuration - 1) { // Immediate start of break
              const msgs = [
                "I need refreshment! Grab some water.",
                "Refresh yourself for the next battle.",
                "Stretch your legs, hero!"
              ]
              onWarningAlert(msgs[Math.floor(Math.random() * msgs.length)])
            }
          }

          // EXISTING WARNING LOGIC (2 mins before end)
          if (!isWorkPhase && newTime === WARNING_TIME && !warningTriggeredRef.current) {
            warningTriggeredRef.current = true
            onWarningAlert("Almost time to dive back in. Prepare yourself.")
          }
          if (isWorkPhase && newTime === WARNING_TIME && !hasWarned) {
            setHasWarned(true)
            onWarningAlert("The portal to rest is opening soon! 2 minutes remain.")
          }
          return newTime
        })
      }, 1000)
    } else if (timeLeft === 0) {
      if (isWorkPhase) {
        setIsWorkPhase(false)
        setTimeLeft(breakDuration)
        setIsRunning(true)
        onCycleComplete(focusState === FOCUS_STATES.FOCUSING)
      } else {
        setIsWorkPhase(true)
        setTimeLeft(workDuration)
        setIsRunning(false)
        onBreakEnd()
      }
    }
    return () => clearInterval(intervalRef.current)
  }, [isRunning, timeLeft, isWorkPhase, hasWarned, focusState, workDuration, breakDuration])

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentTotal = isWorkPhase ? workDuration : breakDuration
  const progress = ((currentTotal - timeLeft) / currentTotal) * 100

  return (
    <div className="bg-obsidian/80 backdrop-blur-sm rounded-2xl p-8 border border-neon-blue shadow-neon relative overflow-hidden">
      {/* Dynamic Glow Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />

      <h2 className={`text-3xl font-bold mb-6 text-center ${isWorkPhase ? 'text-neon-blue' : 'text-neon-cyan'} drop-shadow-neon`}>
        {isWorkPhase ? '⚔️ Focus Phase' : '☕ Break Time'}
      </h2>

      <div className="text-center mb-8">
        <motion.div
          key={timeLeft}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className="text-7xl font-bold text-white mb-4 text-glow font-mono"
        >
          {formatTime(timeLeft)}
        </motion.div>

        {/* Progress Circle */}
        <div className="relative w-64 h-64 mx-auto">
          <svg className="transform -rotate-90 w-64 h-64">
            {/* Background Circle */}
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#1e293b"
              strokeWidth="8"
              fill="none"
            />
            {/* Progress Circle */}
            <motion.circle
              cx="128"
              cy="128"
              r="120"
              stroke={isWorkPhase ? '#0ea5e9' : '#06b6d4'} // Neon Blue / Cyan
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 120}
              initial={{ strokeDashoffset: 2 * Math.PI * 120 }}
              animate={{
                strokeDashoffset: 2 * Math.PI * 120 * (1 - progress / 100),
              }}
              style={{ filter: "drop-shadow(0 0 5px currentColor)" }} // SVG Glow
              transition={{ duration: 1 }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-white drop-shadow-md">
                {Math.round(progress)}%
              </div>
              <div className={`text-sm ${isWorkPhase ? 'text-sky-300' : 'text-cyan-300'}`}>
                {isWorkPhase ? 'System Syncing' : 'Recharging'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {focusState === FOCUS_STATES.WARNING && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-900/40 border border-yellow-500 rounded-lg p-4 text-yellow-200 text-center font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          >
            ⚠️ Connection Unstable - Re-engage!
          </motion.div>
        )}

        {focusState === FOCUS_STATES.PENALIZING && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-900/40 border border-red-500 rounded-lg p-4 text-red-200 text-center font-bold shadow-[0_0_15px_rgba(239,68,68,0.3)]"
          >
            💥 SYSTEM DAMAGE DETECTED - 10 HP LOST!
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default PomodoroTimer
