import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { calculateLevel, getLevelProgress, getXPForNextLevel } from '../utils/xpCalculator'
import { getFromStorage, STORAGE_KEYS } from '../utils/storage'

const Dashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalXP: 0,
    level: 1,
    questsCompleted: 0,
    healthHistory: [],
  })

  useEffect(() => {
    const fetchStats = async () => {
      const user = getFromStorage(STORAGE_KEYS.USER)
      if (!user?.id) return

      try {
        console.log("Fetching stats for user:", user.id)
        const response = await fetch(`/api/users/${user.id}/stats`, {
          credentials: 'include'
        })

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        const data = await response.json()
        console.log("Stats received:", data)

        // Calculate derived stats for UI
        const currentXP = data.totalXP || 0
        const computedLevel = calculateLevel(currentXP)
        const levelProgress = getLevelProgress(currentXP)
        const xpForNextLevel = getXPForNextLevel(computedLevel)

        setStats({
          totalXP: currentXP,
          level: computedLevel, // Use computed level to ensure UI consistency
          questsCompleted: data.questsCompleted || 0,
          healthHistory: data.healthHistory || [],
          levelProgress,
          xpForNextLevel
        })
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
        // Optional: Set some UI error state here if you had one
        // alert("Failed to load dashboard data. check console.")
      }
    }

    fetchStats()
  }, [])

  const handleStartQuest = () => {
    navigate('/quest')
  }

  const handleCustomize = () => {
    navigate('/customize')
  }

  return (
    <div className="min-h-screen py-12 px-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-neon-blue via-cyan-300 to-neon-blue bg-clip-text text-transparent drop-shadow-neon"
        >
          User Dashboard
        </motion.h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Total XP */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-obsidian/50 rounded-xl p-6 border border-neon-blue shadow-neon backdrop-blur-sm"
          >
            <div className="text-sm text-sky-300 mb-2">Total Data Processed (XP)</div>
            <div className="text-4xl font-bold text-neon-blue mb-2 drop-shadow-neon">
              {stats.totalXP.toLocaleString()}
            </div>
            <div className="text-sm text-sky-400">
              {stats.xpForNextLevel ? `${stats.xpForNextLevel - stats.totalXP} XP to next upgrade` : ''}
            </div>
          </motion.div>

          {/* Level */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-obsidian/50 rounded-xl p-6 border border-neon-blue shadow-neon backdrop-blur-sm"
          >
            <div className="text-sm text-sky-300 mb-2">System Level</div>
            <div className="text-4xl font-bold text-white mb-2">
              Lvl {stats.level}
            </div>
            <div className="w-full bg-slate-900 rounded-full h-3 mt-2 border border-slate-700">
              <motion.div
                className="bg-gradient-to-r from-neon-blue to-cyan-400 h-3 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                initial={{ width: 0 }}
                animate={{ width: `${stats.levelProgress || 0}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <div className="text-xs text-sky-400 mt-1">
              {Math.round(stats.levelProgress || 0)}% to Lvl {stats.level + 1}
            </div>
          </motion.div>

          {/* Quests Completed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-obsidian/50 rounded-xl p-6 border border-neon-blue shadow-neon backdrop-blur-sm"
          >
            <div className="text-sm text-sky-300 mb-2">Sessions Completed</div>
            <div className="text-4xl font-bold text-green-400 mb-2 drop-shadow-md">
              {stats.questsCompleted}
            </div>
            <div className="text-sm text-sky-400">
              Successful cycles
            </div>
          </motion.div>
        </div>

        {/* Health History Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-obsidian/50 rounded-xl p-6 border border-neon-blue shadow-neon mb-8 backdrop-blur-sm"
        >
          <h2 className="text-2xl font-bold mb-6 text-neon-blue">Focus Consistency Metrics</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.healthHistory || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14, 165, 233, 0.2)" />
              <XAxis
                dataKey="date"
                stroke="#38bdf8"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="#38bdf8"
                domain={[0, 100]}
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(2, 6, 23, 0.95)',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  color: '#fff',
                  boxShadow: '0 0 10px #0ea5e9'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="focusScore"
                stroke="#0ea5e9"
                strokeWidth={3}
                dot={{ fill: '#0ea5e9', r: 5 }}
                activeDot={{ r: 8, fill: '#fff', stroke: '#0ea5e9' }}
                name="Focus Efficiency (%)"
              />
              <Line
                type="monotone"
                dataKey="sessionsCompleted"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
                name="Total Sessions"
              />
              <Line
                type="monotone"
                dataKey="sessionsFailed"
                stroke="#EF4444"
                strokeWidth={2}
                dot={{ fill: '#EF4444', r: 4 }}
                name="Failed Sessions"
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <motion.button
            onClick={handleStartQuest}
            className="px-8 py-4 bg-transparent border-2 border-neon-blue text-neon-blue rounded-full font-bold text-xl hover:bg-neon-blue hover:text-white transition-all duration-300 shadow-neon hover:shadow-neon-hover relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Initialize New Session</span>
            <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-20 transition-opacity" />
          </motion.button>

          <motion.button
            onClick={handleCustomize}
            className="px-8 py-4 bg-transparent border-2 border-neon-cyan text-neon-cyan rounded-full font-bold text-xl hover:bg-neon-cyan hover:text-white transition-all duration-300 shadow-[0_0_10px_#06b6d4] hover:shadow-[0_0_20px_#06b6d4] relative overflow-hidden group"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10">Configure Avatar</span>
            <div className="absolute inset-0 bg-neon-cyan opacity-0 group-hover:opacity-20 transition-opacity" />
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
