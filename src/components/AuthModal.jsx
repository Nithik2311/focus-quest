import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sanitizeName, sanitizeText, validateEmail } from '../utils/security'
import { saveToStorage, STORAGE_KEYS } from '../utils/storage'
import API_BASE_URL from '../api'

const AuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Sanitize inputs
    const sanitizedName = sanitizeName(formData.name)
    const sanitizedEmail = sanitizeText(formData.email.toLowerCase())

    // Basic Validation
    if (!isLogin && (!sanitizedName || sanitizedName.length < 3)) {
      setError('Name must be at least 3 characters long')
      setIsLoading(false)
      return
    }

    if (!validateEmail(sanitizedEmail)) {
      setError('Please enter a valid email address')
      setIsLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setIsLoading(false)
      return
    }

    try {
      const endpoint = isLogin ? `${API_BASE_URL}/api/auth/login` : `${API_BASE_URL}/api/auth/register`
      const payload = isLogin
        ? { email: sanitizedEmail, password: formData.password }
        : { name: sanitizedName, email: sanitizedEmail, password: formData.password }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include' // Important for cookies
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed')
      }

      // Success
      const userSession = {
        ...data.user,
        // token is now in httpOnly cookie
      }

      saveToStorage(STORAGE_KEYS.USER, userSession)

      // Store token separately if needed, or keeping it in user object is fine for simple usage
      // Ideally storage utility handles it. For now focus on login flow success.

      onSuccess(userSession)
      setFormData({ name: '', email: '', password: '' })

    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-obsidian/90 backdrop-blur-md rounded-2xl p-8 max-w-md w-full shadow-neon border border-neon-blue relative overflow-hidden"
            >
              {/* Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-neon-blue/10 rounded-full blur-3xl -mr-10 -mt-10" />

              <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-neon-blue to-cyan-400 drop-shadow-neon">
                {isLogin ? 'Welcome Back!' : 'Create Account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                {!isLogin && (
                  <div>
                    <label className="block text-sm font-medium mb-2 text-sky-200">
                      Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_#0ea5e9] transition-all"
                      placeholder="Enter your name"
                      required={!isLogin}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-2 text-sky-200">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_#0ea5e9] transition-all"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-sky-200">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-neon-blue focus:shadow-[0_0_10px_#0ea5e9] transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-red-900/20 border border-red-500/50 rounded p-3"
                  >
                    <p className="text-red-400 text-sm text-center font-bold">
                      {error}
                    </p>
                  </motion.div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-transparent border-2 border-neon-blue text-neon-blue rounded-lg font-bold text-lg hover:bg-neon-blue hover:text-white transition-all duration-300 shadow-neon hover:shadow-neon-hover relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="relative z-10">
                    {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
                  </span>
                  <div className="absolute inset-0 bg-neon-blue opacity-0 group-hover:opacity-20 transition-opacity" />
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(!isLogin)
                    setError('')
                    setFormData({ name: '', email: '', password: '' })
                  }}
                  className="text-sky-300 hover:text-white hover:underline transition-colors text-sm"
                >
                  {isLogin
                    ? "Don't have an account? Register"
                    : 'Already have an account? Login'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default AuthModal
