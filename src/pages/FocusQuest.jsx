import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import PomodoroTimer from '../components/PomodoroTimer'
import CharacterDisplay from '../components/CharacterDisplay'
import SpeechBubble from '../components/SpeechBubble'
import StudyModal from '../components/StudyModal'
import { FocusStateMachine, FOCUS_STATES } from '../utils/focusStateMachine'
import { calculatePomodoroXP, XP_BONUS_QUEST_COMPLETION } from '../utils/xpCalculator'
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storage'
import API_BASE_URL from '../api'

const FocusQuest = ({ setIsQuestActive }) => {
  const navigate = useNavigate()
  const [sessionSetup, setSessionSetup] = useState(true)
  const [totalHours, setTotalHours] = useState(1)
  const [currentCycle, setCurrentCycle] = useState(0)
  const [totalCycles, setTotalCycles] = useState(0)
  const [activeQuestConfig, setActiveQuestConfig] = useState(null)
  const [isCompleting, setIsCompleting] = useState(false)

  // Extension Integration
  const [extensionConnected, setExtensionConnected] = useState(false)

  useEffect(() => {
    const checkExt = () => {
      // Check for the data attribute on the <html> element
      if (document.documentElement.getAttribute('data-focus-quest-extension') === 'installed') {
        setExtensionConnected(true)
        return true
      }
      return false
    }

    // Handle message from extension
    const handleMessage = (event) => {
      if (event.data.type === 'FOCUS_QUEST_EXTENSION_READY' && event.data.source === 'FOCUS_QUEST_EXTENSION') {
        setExtensionConnected(true)
      }
    }
    window.addEventListener('message', handleMessage)

    // Initial check
    if (!checkExt()) {
      // "Ping" the extension in case it's already there but we missed the ready message
      window.postMessage({ type: 'PING_EXTENSION', source: 'FOCUS_QUEST_APP' }, '*')
    }

    // Fallback polling
    const interval = setInterval(() => {
      if (checkExt()) clearInterval(interval)
    }, 1000)

    return () => {
      window.removeEventListener('message', handleMessage)
      clearInterval(interval)
    }
  }, [])

  // Custom Timer State
  const [timerMode, setTimerMode] = useState('pomodoro') // 'pomodoro' | 'custom'
  const [customFocusTime, setCustomFocusTime] = useState(25)
  const [customBreakTime, setCustomBreakTime] = useState(5)
  const [customCycles, setCustomCycles] = useState(4)

  const [hp, setHp] = useState(100)
  const [xp, setXp] = useState(0)
  const [focusState, setFocusState] = useState(FOCUS_STATES.IDLE)
  const [speechMessage, setSpeechMessage] = useState('')
  const [showWarning, setShowWarning] = useState(false)

  // Study Mode State
  const [studyUrls, setStudyUrls] = useState([]) // { id, url, title }
  const [newUrl, setNewUrl] = useState('')
  const [currentStudyUrl, setCurrentStudyUrl] = useState(null) // ID of active modal

  // Task State
  const [tasks, setTasks] = useState([])
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskCycles, setNewTaskCycles] = useState(1)
  const [showMissionLog, setShowMissionLog] = useState(false) // Toggle for active view

  const stateMachineRef = useRef(new FocusStateMachine())
  const sessionRef = useRef(null)

  useEffect(() => {
    // Fetch fresh stats from API to ensure reliability
    const user = getFromStorage(STORAGE_KEYS.USER)
    if (user?.id) {
      fetch(`${API_BASE_URL}/api/users/${user.id}/stats`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.totalXP !== undefined) {
            setXp(data.totalXP)
            // Sync to local storage
            const stats = getFromStorage(STORAGE_KEYS.STATS) || {}
            stats.totalXP = data.totalXP
            stats.level = Math.floor(data.totalXP / 1000) + 1
            stats.questsCompleted = data.questsCompleted || stats.questsCompleted || 0
            saveToStorage(STORAGE_KEYS.STATS, stats)
          }
        })
        .catch(err => {
          console.error("Failed to fetch initial stats", err)
          // Fallback
          const stats = getFromStorage(STORAGE_KEYS.STATS) || { totalXP: 0 }
          setXp(stats.totalXP || 0)
        })
    } else {
      const stats = getFromStorage(STORAGE_KEYS.STATS) || { totalXP: 0 }
      setXp(stats.totalXP || 0)
    }

    const unsubscribe = stateMachineRef.current.subscribe((newState) => {
      setFocusState((prevState) => {
        if (
          (prevState === FOCUS_STATES.PENALIZING || prevState === FOCUS_STATES.WARNING) &&
          newState === FOCUS_STATES.FOCUSING
        ) {
          const msg = "Back to the fight! Let's go!"
          setSpeechMessage(msg)
          speak(msg)
          setTimeout(() => setSpeechMessage(''), 3000)
          setShowWarning(false)
        }
        return newState
      })
    })

    const unsubscribeHPDrain = stateMachineRef.current.onHPDrain((damage) => {
      setHp(prev => {
        const newHp = Math.max(0, prev - damage)
        return newHp
      })
      setShowWarning(true)
    })

    const handleBeforeUnload = (e) => {
      if (focusState === FOCUS_STATES.FOCUSING || focusState === FOCUS_STATES.WARNING) {
        e.preventDefault()
        e.returnValue = 'You will lose HP if you leave during a focus session!'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Extension Listener
    const handleExtensionMessage = (event) => {
      if (event.source !== window) return
      if (event.data.type === 'QUEST_VIOLATION_DETECTED' && event.data.source === 'FOCUS_QUEST_EXTENSION') {
        console.log("Violation detected via extension:", event.data.url)
        // Force penalty state instantly (bypass warning)
        if (stateMachineRef.current && focusState !== FOCUS_STATES.BREAKING) {
          stateMachineRef.current.forcePenalty()
          handleWarningAlert(`⚠️ UNAUTHORIZED SECTOR: ${event.data.url}`)
        }
      }
    }
    window.addEventListener('message', handleExtensionMessage)

    return () => {
      unsubscribe()
      unsubscribeHPDrain()
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('message', handleExtensionMessage)
      stateMachineRef.current.reset()

      // Stop Quest in Extension
      window.postMessage({
        type: 'STOP_QUEST',
        source: 'FOCUS_QUEST_APP',
        payload: { type: 'STOP_QUEST' }
      }, '*')

      if (setIsQuestActive) setIsQuestActive(false) // Reset navbar on unmount
    }
  }, [setIsQuestActive])

  const handleStartSession = () => {
    let cycles, workDur, breakDur, totalParamsHours;

    if (timerMode === 'pomodoro') {
      const sanitizedHours = Math.max(0.5, Math.min(8, totalHours))
      cycles = Math.max(1, Math.ceil(sanitizedHours * 2))
      totalParamsHours = sanitizedHours
      workDur = 25 * 60
      breakDur = 5 * 60
    } else {
      const safeCycles = Math.max(1, Math.min(20, customCycles))
      const safeFocus = Math.max(1, Math.min(120, customFocusTime))
      const safeBreak = Math.max(1, Math.min(60, customBreakTime))

      cycles = safeCycles
      workDur = safeFocus * 60
      breakDur = safeBreak * 60
      totalParamsHours = (safeCycles * (safeFocus + safeBreak)) / 60
    }

    setTotalCycles(cycles)
    setCurrentCycle(0)
    setSessionSetup(false)
    setHp(100)

    // FREEZE CONFIG FOR TIMER
    setActiveQuestConfig({
      workDuration: workDur,
      breakDuration: breakDur
    })

    if (setIsQuestActive) setIsQuestActive(true)

    stateMachineRef.current.startFocus()

    // Notify Extension
    const allowedUrlsList = studyUrls.map(u => u.url)
    window.postMessage({
      type: 'START_QUEST',
      source: 'FOCUS_QUEST_APP',
      payload: {
        type: 'START_QUEST',
        allowedUrls: allowedUrlsList
      }
    }, '*')

    sessionRef.current = {
      startTime: Date.now(),
      totalHours: totalParamsHours,
      totalCycles: cycles,
      earnedXP: 0,
      completedCycles: 0
    }
    saveToStorage(STORAGE_KEYS.SESSION, sessionRef.current)
  }

  const reportSession = async (status) => {
    const user = getFromStorage(STORAGE_KEYS.USER)
    if (!user?.id || !sessionRef.current) return

    try {
      const sessionData = {
        userId: user.id,
        totalHours: sessionRef.current.totalHours,
        totalCycles: sessionRef.current.totalCycles,
        completedCycles: sessionRef.current.completedCycles || 0,
        totalXpEarned: sessionRef.current.earnedXP || 0,
        status: status
      }

      await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData),
        credentials: 'include'
      })
    } catch (error) {
      console.error("Failed to report session", error)
    }
  }

  const handleQuestFailed = () => {
    stateMachineRef.current.stopHPDrain() // Ensure drain stops immediately
    setSpeechMessage("SYSTEM CRITICAL: HP DEPLETED. QUEST FAILED.")

    speak("SYSTEM CRITICAL: HP DEPLETED. QUEST FAILED.")

    if (setIsQuestActive) setIsQuestActive(false)
    reportSession('abandoned')

    // Stop Extension Monitoring
    window.postMessage({
      type: 'STOP_QUEST',
      source: 'FOCUS_QUEST_APP',
      payload: { type: 'STOP_QUEST' }
    }, '*')

    setTimeout(() => {
      navigate('/dashboard')
    }, 3000)
  }

  // Monitor HP for failure
  useEffect(() => {
    if (hp === 0) {
      handleQuestFailed()
    }
  }, [hp])

  const recordAction = async (type) => {
    const user = getFromStorage(STORAGE_KEYS.USER)
    if (!user?.id) return null

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }), // 'cycle' or 'quest'
        credentials: 'include'
      })

      const data = await response.json()

      if (data.success) {
        // Sync local state with Server Truth
        setXp(data.totalXP)

        // Update Local Storage Cache
        const stats = getFromStorage(STORAGE_KEYS.STATS) || {}
        stats.totalXP = data.totalXP
        stats.level = data.level
        stats.questsCompleted = data.questsCompleted
        saveToStorage(STORAGE_KEYS.STATS, stats)

        return data
      }
    } catch (error) {
      console.error("Failed to sync progress", error)
    }
    return null
  }

  const handleQuestComplete = async () => {
    if (isCompleting) return
    setIsCompleting(true)

    const data = await recordAction('quest')
    const addedXP = data?.addedXP || 500

    if (sessionRef.current) {
      sessionRef.current.earnedXP = (sessionRef.current.earnedXP || 0) + addedXP
    }

    const msg = `Mission Accomplished! Earned ${addedXP} Bonus XP!`
    setSpeechMessage(msg)
    speak(msg)

    if (setIsQuestActive) setIsQuestActive(false) // Release lockdown
    reportSession('completed')

    // Stop Extension Monitoring
    window.postMessage({
      type: 'STOP_QUEST',
      source: 'FOCUS_QUEST_APP',
      payload: { type: 'STOP_QUEST' }
    }, '*')

    setTimeout(() => {
      navigate('/dashboard')
    }, 3000)
  }

  const handleCycleComplete = async (wasPerfect) => {
    const newCycle = currentCycle + 1
    setCurrentCycle(newCycle)

    // Sync Progress via Server
    const data = await recordAction('cycle')
    const addedXP = data?.addedXP || 200

    // Update session ref
    if (sessionRef.current) {
      sessionRef.current.earnedXP = (sessionRef.current.earnedXP || 0) + addedXP
      sessionRef.current.completedCycles = newCycle
    }

    // Check for quest completion bonus
    if (newCycle >= totalCycles) {
      handleQuestComplete()
    } else {
      stateMachineRef.current.startBreak()
    }
  }

  const handleBreakEnd = () => {
    stateMachineRef.current.startFocus()
  }

  // --- Voice Agent Helper ---
  const speak = (text) => {
    if (!window.speechSynthesis) return

    // Cancel any current speaking to avoid overlaps
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.volume = 1
    utterance.rate = 1
    utterance.pitch = 1

    // Optional: Select a specific computer voice that sounds catchy
    // const voices = window.speechSynthesis.getVoices()
    // utterance.voice = voices.find(v => v.name.includes('Google US English')) || null

    window.speechSynthesis.speak(utterance)
  }

  const handleWarningAlert = (message) => {
    setSpeechMessage(message)
    speak(message)
    setTimeout(() => setSpeechMessage(''), 5000)
  }

  // --- Study Mode Helpers ---
  const addUrl = () => {
    if (!newUrl.trim()) return
    let formattedUrl = newUrl.trim()
    if (!formattedUrl.match(/^https?:\/\//i)) {
      formattedUrl = 'https://' + formattedUrl
    }
    setStudyUrls([...studyUrls, { id: Date.now(), url: formattedUrl, title: `Resource ${studyUrls.length + 1}` }])
    setNewUrl('')
  }

  const removeUrl = (id) => {
    setStudyUrls(studyUrls.filter(u => u.id !== id))
  }

  // --- Task Helpers ---
  const addTask = () => {
    if (!newTaskName.trim()) return
    setTasks([...tasks, {
      id: Date.now(),
      name: newTaskName,
      cycles: Math.max(1, parseInt(newTaskCycles) || 1), // Clamp minimum cycles to 1
      completed: false
    }])
    setNewTaskName('')
    setNewTaskCycles(1)
  }

  const toggleTask = (id) => {
    const updatedTasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    setTasks(updatedTasks)

    const allCompleted = updatedTasks.every(t => t.completed)
    if (allCompleted && updatedTasks.length > 0) {
      console.log("All tasks completed! Triggering Quest Success...")
      setTimeout(() => {
        handleQuestComplete()
      }, 1000)
    }
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
  }

  const handleAuthorizedLink = (url) => {
    // 1. Authorize the exit so penalty doesn't trigger
    if (stateMachineRef.current) {
      stateMachineRef.current.setAuthorizedExit(true)
    }

    // 2. Open in new tab
    window.open(url, '_blank')

    // 3. Reset authorization when user comes back
    // We use 'once' so it only fires on the immediate return
    window.addEventListener('focus', () => {
      if (stateMachineRef.current) {
        stateMachineRef.current.setAuthorizedExit(false)
      }
      const msg = "Welcome back hero! Focus protocols re-engaged."
      setSpeechMessage(msg)
      speak(msg)
      setTimeout(() => setSpeechMessage(''), 3000)
    }, { once: true })
  }

  const characterConfig = getFromStorage(STORAGE_KEYS.CHARACTER) || {
    skinTone: '#F3C4A0',
    hasGlasses: false,
    hasShoes: true,
    auraColor: '#0ea5e9',
  }

  if (sessionSetup) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-obsidian/80 backdrop-blur-md rounded-2xl p-8 max-w-2xl w-full border border-neon-blue shadow-neon"
        >
          <h2 className="text-3xl font-bold mb-6 text-center text-neon-blue drop-shadow-neon">
            Setup Your Quest
          </h2>

          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Time Setup */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Duration</h3>

                {/* Timer Mode Toggle */}
                <div className="flex gap-2 mb-4 p-1 bg-slate-900 rounded-lg">
                  <button
                    onClick={() => setTimerMode('pomodoro')}
                    className={`flex-1 py-1 rounded-md text-sm font-medium transition-all ${timerMode === 'pomodoro' ? 'bg-neon-blue text-white shadow-neon' : 'text-gray-400 hover:text-white'}`}
                  >
                    Pomodoro (25/5)
                  </button>
                  <button
                    onClick={() => setTimerMode('custom')}
                    className={`flex-1 py-1 rounded-md text-sm font-medium transition-all ${timerMode === 'custom' ? 'bg-neon-cyan text-slate-900 shadow-neon' : 'text-gray-400 hover:text-white'}`}
                  >
                    Custom Timer
                  </button>
                </div>

                {timerMode === 'pomodoro' ? (
                  <>
                    <label className="block text-sm font-medium mb-2 text-sky-200">
                      Total Study Hours
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="8"
                      step="0.5"
                      value={totalHours}
                      onChange={(e) => setTotalHours(parseFloat(e.target.value) || 1)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-neon-blue/50 text-white focus:outline-none focus:border-neon-blue focus:shadow-neon transition-all"
                    />
                    <p className="text-sm text-sky-400 mt-2">
                      {Math.ceil((totalHours * 60) / 30)} Standard Cycles (25m Focus + 5m Break)
                    </p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium mb-1 text-sky-200">Focus Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={customFocusTime}
                        onChange={(e) => setCustomFocusTime(parseInt(e.target.value) || 25)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-neon-cyan/50 text-white focus:outline-none focus:border-neon-cyan transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-sky-200">Break Duration (mins)</label>
                      <input
                        type="number"
                        min="1"
                        max="60"
                        value={customBreakTime}
                        onChange={(e) => setCustomBreakTime(parseInt(e.target.value) || 5)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-neon-cyan/50 text-white focus:outline-none focus:border-neon-cyan transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1 text-sky-200">Total Sessions</label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={customCycles}
                        onChange={(e) => setCustomCycles(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-neon-cyan/50 text-white focus:outline-none focus:border-neon-cyan transition-all"
                      />
                    </div>
                    <p className="text-sm text-sky-400 mt-2">
                      Total Duration: {Math.round(customCycles * (customFocusTime + customBreakTime) / 60 * 10) / 10} Hours
                    </p>
                  </div>
                )}
              </div>

              {/* Mission Objectives (Tasks) */}
              <div className="md:col-span-2 bg-slate-900/40 p-4 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold text-white mb-2">My Mission Objectives</h3>
                <p className="text-xs text-gray-400 mb-2">Define your checklist for this session.</p>

                <div className="flex gap-2 mb-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1 text-sky-200">Task Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Finish Math Chapter 1"
                      value={newTaskName}
                      onChange={(e) => setNewTaskName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addTask()}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-white focus:border-neon-blue outline-none"
                    />
                  </div>
                  <div className="w-24">
                    <label className="block text-xs font-medium mb-1 text-sky-200">Est. Cycles</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={newTaskCycles}
                      onChange={(e) => setNewTaskCycles(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-white focus:border-neon-blue outline-none text-center"
                    />
                  </div>
                  <button
                    onClick={addTask}
                    className="px-4 py-2 bg-slate-800 text-neon-blue rounded hover:bg-slate-700 font-bold border border-slate-700"
                  >
                    ADD
                  </button>
                </div>

                {/* Task List Preview */}
                {tasks.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto custom-scrollbar mt-2 bg-black/20 p-2 rounded">
                    {tasks.map(t => (
                      <div key={t.id} className="bg-slate-800/80 p-2 rounded flex justify-between items-center border border-slate-700">
                        <div>
                          <div className="text-sm text-gray-200 font-medium">{t.name}</div>
                          <div className="text-xs text-sky-400">{t.cycles} Cycles Est.</div>
                        </div>
                        <button onClick={() => deleteTask(t.id)} className="text-red-400 hover:text-red-300 px-2 font-bold">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 italic mt-2">No tasks added yet.</div>
                )}
              </div>

              {/* URL Setup */}
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Allowed Resources</h3>
                <p className="text-xs text-gray-400 mb-2">Add URLs to study without penalty.</p>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="e.g. chatgpt.com"
                    className="flex-1 px-3 py-2 rounded bg-slate-900 border border-slate-700 text-sm text-white focus:border-neon-blue outline-none"
                    onKeyDown={(e) => e.key === 'Enter' && addUrl()}
                  />
                  <button
                    onClick={addUrl}
                    className="px-3 py-2 bg-slate-800 text-neon-blue rounded hover:bg-slate-700"
                  >
                    +
                  </button>
                </div>
                <ul className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {studyUrls.map(u => (
                    <li key={u.id} className="flex justify-between items-center bg-slate-900/50 p-2 rounded text-sm text-gray-300">
                      <span className="truncate max-w-[150px]">{u.url}</span>
                      <button onClick={() => removeUrl(u.id)} className="text-red-400 hover:text-red-300">×</button>
                    </li>
                  ))}
                  {studyUrls.length === 0 && <li className="text-gray-500 text-xs italic">No URLs added. Any tab switch will drain HP.</li>}
                </ul>
              </div>
            </div>

            <motion.button
              onClick={handleStartSession}
              className="w-full py-4 bg-transparent border-2 border-neon-blue text-neon-blue rounded-lg font-bold text-xl hover:bg-neon-blue hover:text-white transition-all duration-300 shadow-neon hover:shadow-neon-hover"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Start Quest (Lockdown Mode)
            </motion.button>

            {!extensionConnected && (
              <div className="text-center mt-2 p-2 bg-yellow-900/20 border border-yellow-700/50 rounded text-xs text-yellow-500">
                <span>⚠️ Companion Extension not detected. External tabs won't be monitored. </span>
                <br />
                <span className="opacity-70">Install it to enable full lockdown protection.</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 px-4 relative z-10 transition-all duration-500">
      <div className={`max-w-6xl mx-auto transition-all`}>

        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* HP Card */}
          <div className="bg-obsidian/50 rounded-lg p-4 border border-neon-blue/50 shadow-neon relative overflow-hidden group">
            <div className="absolute inset-0 bg-neon-blue/5 opacity-0 group-hover:opacity-10 transition-opacity" />
            <div className="text-sm text-sky-300">System Integrity (HP)</div>
            <div className="text-2xl font-bold text-red-500">{hp}/100</div>
            <div className="w-full bg-slate-900 rounded-full h-2 mt-2 border border-slate-700">
              <div
                className="bg-red-500 h-2 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                style={{ width: `${hp}%` }}
              />
            </div>
          </div>

          {/* XP Card */}
          <div className="bg-obsidian/50 rounded-lg p-4 border border-neon-blue/50 shadow-neon">
            <div className="text-sm text-sky-300">Accumulated Data (XP)</div>
            <div className="text-2xl font-bold text-neon-blue drop-shadow-neon">{xp}</div>
          </div>

          {/* Cycle Card */}
          <div className="bg-obsidian/50 rounded-lg p-4 border border-neon-blue/50 shadow-neon">
            <div className="text-sm text-sky-300">Current Cycle</div>
            <div className="text-2xl font-bold text-white">
              {currentCycle}/{totalCycles}
            </div>
          </div>

          {/* State Card */}
          <div className="bg-obsidian/50 rounded-lg p-4 border border-neon-blue/50 shadow-neon">
            <div className="text-sm text-sky-300">System State</div>
            <div className="text-lg font-bold capitalize text-neon-cyan drop-shadow-sm flex items-center gap-2">
              {focusState}
              {extensionConnected && (
                <span className="text-[10px] bg-green-900 text-green-300 px-1 rounded border border-green-500 animate-pulse" title="Companion Extension Active">
                  LINKED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Character Display */}
          <div className="relative">
            <CharacterDisplay config={characterConfig} hp={hp} state={focusState} />
            <AnimatePresence>
              {speechMessage && (
                <SpeechBubble message={speechMessage} />
              )}
            </AnimatePresence>
            {showWarning && focusState === FOCUS_STATES.PENALIZING && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-600/90 text-white px-6 py-3 rounded-lg font-bold border-2 border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.6)]"
              >
                ⚠️ CRITICAL FAILURE!
              </motion.div>
            )}
          </div>

          {/* Timer */}
          <div>
            <PomodoroTimer
              focusState={focusState}
              onCycleComplete={handleCycleComplete}
              onBreakEnd={handleBreakEnd}
              onWarningAlert={handleWarningAlert}
              workDuration={activeQuestConfig?.workDuration || 25 * 60}
              breakDuration={activeQuestConfig?.breakDuration || 5 * 60}
            />
          </div>
        </div>
      </div>



      {/* Mission Log Dock (Left Side) */}
      {tasks.length > 0 && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 z-40">
          <AnimatePresence>
            {!showMissionLog ? (
              <motion.button
                initial={{ x: -50 }}
                animate={{ x: 0 }}
                onClick={() => setShowMissionLog(true)}
                className="bg-obsidian/90 border-r-2 border-neon-cyan p-3 rounded-r-xl shadow-neon flex flex-col items-center gap-2 group hover:bg-slate-800 transition-colors"
              >
                <span className="text-xl">📋</span>
                <span className="text-[10px] text-neon-cyan font-bold rotate-180" style={{ writingMode: 'vertical-rl' }}>MISSIONS</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ x: -300 }}
                animate={{ x: 0 }}
                exit={{ x: -300 }}
                className="bg-obsidian/95 border-r border-t border-b border-neon-cyan p-4 rounded-r-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] w-80 max-h-[80vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                  <h3 className="text-neon-cyan font-bold text-lg">Mission Log</h3>
                  <button onClick={() => setShowMissionLog(false)} className="text-gray-400 hover:text-white">×</button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                  {tasks.map(t => (
                    <div
                      key={t.id}
                      onClick={() => toggleTask(t.id)}
                      className={`p-3 rounded border cursor-pointer transition-all ${t.completed
                        ? 'bg-green-900/20 border-green-500/30 opacity-60'
                        : 'bg-slate-800/50 border-slate-700 hover:border-neon-cyan/50 hover:bg-slate-800'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-1 w-4 h-4 rounded border flex items-center justify-center ${t.completed ? 'bg-green-500 border-green-500' : 'border-gray-500'}`}>
                          {t.completed && <span className="text-black text-xs font-bold">✓</span>}
                        </div>
                        <div>
                          <p className={`text-sm ${t.completed ? 'line-through text-gray-500' : 'text-gray-200'}`}>{t.name}</p>
                          <p className="text-[10px] text-sky-400 mt-1">{t.cycles} Cycles Est.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-2 border-t border-gray-700">
                  <div className="text-xs text-center text-gray-400">
                    {tasks.filter(t => t.completed).length} / {tasks.length} Completed
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: `${(tasks.filter(t => t.completed).length / tasks.length) * 100}%` }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Study Dock (Sidebar) */}
      {studyUrls.length > 0 && (
        <div className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-obsidian/90 border-l-2 border-neon-blue p-2 rounded-l-xl shadow-neon z-40">
          <div className="flex flex-col gap-4">
            <div className="text-xs text-center text-neon-blue font-bold tracking-widest vertical-text" style={{ writingMode: 'vertical-rl' }}>RESOURCES</div>
            {studyUrls.map(u => (
              <button
                key={u.id}
                onClick={() => setCurrentStudyUrl(u.url)}
                className="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center border border-slate-600 hover:border-green-400 hover:bg-slate-700 transition-all group relative"
              >
                <span className="text-white text-xs">🔗</span>
                <span className="absolute right-12 bg-black text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none border border-green-400">
                  Open: {u.url}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Study Modal */}
      <AnimatePresence>
        {currentStudyUrl && (
          <StudyModal
            url={currentStudyUrl}
            onClose={() => setCurrentStudyUrl(null)}
            onOpenExternal={(url) => {
              handleAuthorizedLink(url)
              setCurrentStudyUrl(null)
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default FocusQuest
