import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import CustomizableCharacter from '../components/CustomizableCharacter'
import { saveToStorage, getFromStorage, STORAGE_KEYS } from '../utils/storage'
import { calculateLevel } from '../utils/xpCalculator'
import API_BASE_URL from '../api'

const CharacterCustomization = () => {
  const navigate = useNavigate()
  const [level, setLevel] = useState(1)
  const [config, setConfig] = useState({
    gender: 'masculine',
    skinTone: '#F3C4A0',
    hairLength: 'normal', // none, normal, long
    hasBeard: false,
    armorType: 'basic', // basic, rogue, knight, mage, cyber, etc.
    hasGlasses: false,
    glassesColor: '#000000',
    hasShoes: true, // Kept for legacy or specific armors
    shoesColor: '#4B5563',
    auraColor: '#0ea5e9',
    auraIntensity: 0.5,
  })

  // Load level on mount from API
  useEffect(() => {
    const fetchStats = async () => {
      const user = getFromStorage(STORAGE_KEYS.USER)
      if (!user?.id) return

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/stats`, { credentials: 'include' })
        const data = await response.json()

        if (data.totalXP !== undefined) {
          const currentLevel = calculateLevel(data.totalXP)
          setLevel(currentLevel)
        }
      } catch (error) {
        console.error("Failed to fetch levels", error)
        // Fallback to local storage
        const stats = getFromStorage(STORAGE_KEYS.STATS)
        if (stats?.totalXP) {
          setLevel(calculateLevel(stats.totalXP))
        }
      }
    }

    fetchStats()

    // 1. Load Local Config Immediately (Fast & Offline Support)
    const localConfig = getFromStorage(STORAGE_KEYS.CHARACTER)
    if (localConfig) {
      console.log("Loaded config from local storage:", localConfig)
      setConfig(prev => ({ ...prev, ...localConfig }))
    }

    // 2. Load latest from API (Sync)
    const fetchConfig = async () => {
      const user = getFromStorage(STORAGE_KEYS.USER)
      if (!user?.id) return

      try {
        const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/character`, { credentials: 'include' })
        const data = await response.json()
        if (data && !data.error) {
          console.log("Server config check:", data)

          if (!getFromStorage(STORAGE_KEYS.CHARACTER)) {
            setConfig(prev => ({ ...prev, ...data }))
            saveToStorage(STORAGE_KEYS.CHARACTER, data)
          }
        }
      } catch (error) {
        console.error("Failed to fetch character config", error)
      }
    }
    fetchConfig()
  }, [])

  const handleChange = (key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    // 1. Save to Local Storage (Immediate feedback/offline)
    saveToStorage(STORAGE_KEYS.CHARACTER, config)

    // 2. Save to Backend
    const user = getFromStorage(STORAGE_KEYS.USER)

    if (!user?.id) {
      console.warn("No user ID found, saving locally only.")
      navigate('/quest')
      return
    }

    try {
      console.log("Saving character for user:", user.id)
      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/character`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      console.log("Character saved successfully to backend")
    } catch (error) {
      console.error("Failed to save character to backend", error)
    }

    navigate('/quest')
  }

  const armorSets = [
    { id: 'basic', name: 'Civilian', color: '#4B5563', minLevel: 1 },
    { id: 'rogue', name: 'Rogue', color: '#2D1B18', minLevel: 1 },
    { id: 'knight', name: 'Knight', color: '#94A3B8', minLevel: 1 },
    { id: 'mage', name: 'Mage', color: '#6366F1', minLevel: 4 },
    { id: 'cyber', name: 'Cyber', color: '#0ea5e9', minLevel: 5 },
    // Male Exclusives
    { id: 'barbarian', name: 'Barbarian', color: '#5D4037', minLevel: 2, gender: 'masculine' },
    { id: 'barbarianKing', name: 'Barb. King', color: '#B91C1C', minLevel: 5, gender: 'masculine' },
    { id: 'king', name: 'King', color: '#4C1D95', minLevel: 8, gender: 'masculine' },
    // Female Exclusives
    { id: 'queen', name: 'Queen', color: '#BE185D', minLevel: 8, gender: 'feminine' },
    { id: 'angel', name: 'Angel', color: '#E2E8F0', minLevel: 5, gender: 'feminine' },
    { id: 'fairyQueen', name: 'Fairy', color: '#10B981', minLevel: 2, gender: 'feminine' },
  ]

  const auraColors = [
    { color: '#0ea5e9', minLevel: 1 }, // Blue
    { color: '#06b6d4', minLevel: 2 }, // Cyan
    { color: '#8b5cf6', minLevel: 3 }, // Purple
    { color: '#ec4899', minLevel: 4 }, // Pink
    { color: '#f59e0b', minLevel: 5 }, // Amber
    { color: '#ef4444', minLevel: 6 }, // Red
  ]

  return (
    <div className="min-h-screen py-12 px-4 flex items-center justify-center relative overflow-hidden z-10">
      <div className="max-w-4xl w-full grid md:grid-cols-2 gap-12 bg-obsidian/80 backdrop-blur-md rounded-2xl p-8 border border-neon-blue shadow-neon">

        {/* Character Preview */}
        <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded-xl p-8 border border-neon-blue/30 relative">
          <div className="absolute inset-0 bg-neon-blue/5 rounded-xl" />
          <h2 className="text-2xl font-bold mb-6 text-neon-blue drop-shadow-neon">Avatar Preview</h2>
          <CustomizableCharacter config={config} />
          <div className="mt-4 px-3 py-1 bg-slate-800 rounded-full text-xs font-mono text-cyan-300 border border-cyan-500/30">
            Current Level: <span className="text-neon-cyan font-bold text-lg">{level}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">Customize Avatar</h1>
            <p className="text-sky-300 mb-6">Forge your identity.</p>
          </div>

          <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">

            {/* Body Type */}
            <div className="bg-obsidian/50 p-4 rounded-lg border border-neon-blue/20">
              <label className="block text-sm font-medium mb-2 text-sky-200">Body Type</label>
              <div className="flex gap-4">
                {['masculine', 'feminine'].map((type) => (
                  <button
                    key={type}
                    onClick={() => handleChange('gender', type)}
                    className={`flex-1 py-2 rounded-lg capitalize transition-all ${config.gender === type
                      ? 'bg-neon-blue text-white shadow-neon'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Hair & Beard */}
            <div className="bg-obsidian/50 p-4 rounded-lg border border-neon-blue/20">
              <label className="block text-sm font-medium mb-2 text-sky-200">Hair Style</label>
              <div className="flex gap-2 mb-3">
                {['none', 'normal', 'long'].map((length) => (
                  <button
                    key={length}
                    onClick={() => handleChange('hairLength', length)}
                    className={`flex-1 py-2 rounded-lg capitalize text-sm transition-all ${config.hairLength === length
                      ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                      : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'
                      }`}
                  >
                    {length}
                  </button>
                ))}
              </div>

              {/* Hair Color Picker */}
              <div className="mb-3">
                <label className="block text-xs font-medium mb-1 text-sky-200">Hair Color</label>
                <div className="flex gap-1.5 flex-wrap">
                  {[
                    { color: '#2D1B18', minLevel: 1 }, // Brown (Default)
                    { color: '#000000', minLevel: 1 }, // Black
                    { color: '#EAB308', minLevel: 2 }, // Blonde
                    { color: '#B91C1C', minLevel: 3 }, // Red
                    { color: '#FFFFFF', minLevel: 4 }, // White
                    { color: '#4F46E5', minLevel: 6 }, // Blue (Anime)
                    { color: '#EC4899', minLevel: 7 }, // Pink
                  ].map(({ color, minLevel }) => {
                    const isLocked = level < minLevel
                    return (
                      <button
                        key={color}
                        onClick={() => !isLocked && handleChange('hairColor', color)}
                        disabled={isLocked}
                        className={`w-6 h-6 rounded-full border transition-all relative ${config.hairColor === color ? 'border-white scale-110 shadow-sm' : 'border-transparent'
                          } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                        style={{ backgroundColor: color }}
                        title={isLocked ? `Unlocks at Level ${minLevel}` : 'Dye Hair'}
                      >
                        {isLocked && <span className="absolute inset-0 flex items-center justify-center text-[8px] grayscale">🔒</span>}
                      </button>
                    )
                  })}
                </div>
              </div>

              {config.gender === 'masculine' && (
                <button
                  onClick={() => handleChange('hasBeard', !config.hasBeard)}
                  className={`w-full py-2 rounded-lg border transition-all ${config.hasBeard
                    ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                    : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'
                    }`}
                >
                  {config.hasBeard ? 'Beard: ON' : 'Beard: OFF'}
                </button>
              )}
            </div>

            {/* Armor Set */}
            <div className="bg-obsidian/50 p-4 rounded-lg border border-neon-blue/20">
              <label className="block text-sm font-medium mb-2 text-sky-200">
                Outfits <span className="text-xs text-sky-500 ml-1">(Higher Levels Unlock More!)</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {armorSets
                  .filter(set => !set.gender || set.gender === config.gender)
                  .map((set) => {
                    const isLocked = level < set.minLevel
                    return (
                      <button
                        key={set.id}
                        onClick={() => !isLocked && handleChange('armorType', set.id)}
                        disabled={isLocked}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all border relative overflow-hidden group ${config.armorType === set.id
                          ? 'bg-slate-800 border-neon-blue shadow-neon transform scale-105'
                          : isLocked
                            ? 'bg-slate-900/50 border-transparent opacity-50 cursor-not-allowed'
                            : 'bg-slate-900 border-transparent hover:border-slate-600'
                          }`}
                        title={isLocked ? `Unlocks at Level ${set.minLevel}` : set.name}
                      >
                        <div
                          className="w-6 h-6 rounded-full mb-1 border border-white/10"
                          style={{ backgroundColor: set.color }}
                        />
                        <span className="text-[10px] text-gray-300 truncate w-full text-center">{set.name}</span>

                        {isLocked && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center backdrop-blur-[1px]">
                            <span className="text-[10px] font-bold text-white flex flex-col items-center">
                              <span>🔒</span>
                              <span>Lvl {set.minLevel}</span>
                            </span>
                          </div>
                        )}
                      </button>
                    )
                  })}
              </div>
            </div>

            {/* Aura Color */}
            <div className="bg-obsidian/50 p-4 rounded-lg border border-neon-blue/20">
              <label className="block text-sm font-medium mb-2 text-sky-200">Aura Color</label>
              <div className="flex gap-2 justify-between flex-wrap">
                {auraColors.map(({ color, minLevel }) => {
                  const isLocked = level < minLevel
                  return (
                    <button
                      key={color}
                      onClick={() => !isLocked && handleChange('auraColor', color)}
                      disabled={isLocked}
                      className={`w-8 h-8 rounded-full border-2 transition-transform relative ${config.auraColor === color ? 'border-white scale-110 shadow-[0_0_10px_currentColor]' : 'border-transparent'
                        } ${isLocked ? 'opacity-30 grayscale cursor-not-allowed' : 'hover:scale-110'}`}
                      style={{ backgroundColor: color }}
                      title={isLocked ? `Unlocks at Level ${minLevel}` : 'Select Aura'}
                    >
                      {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <span className="text-[8px]">🔒</span>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Accessories Toggle */}
            <div className="flex gap-4">
              <button
                onClick={() => level >= 2 && handleChange('hasGlasses', !config.hasGlasses)}
                disabled={level < 2}
                className={`flex-1 py-3 rounded-lg border transition-all relative overflow-hidden ${config.hasGlasses
                  ? 'bg-neon-cyan/20 border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-slate-800 border-slate-700 text-gray-400 hover:bg-slate-700'
                  } ${level < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                👓 Glasses
                {level < 2 && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <span className="text-xs font-bold text-white">🔒 Lvl 2</span>
                  </div>
                )}
              </button>
            </div>
          </div>

          <motion.button
            onClick={handleSave}
            className="w-full py-4 bg-transparent border-2 border-neon-blue text-neon-blue rounded-lg font-bold text-xl hover:bg-neon-blue hover:text-white transition-all duration-300 shadow-neon hover:shadow-neon-hover mt-4"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Save Character
          </motion.button>
        </div>
      </div>
    </div>
  )
}

export default CharacterCustomization
