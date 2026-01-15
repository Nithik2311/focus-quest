import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { saveToStorage, STORAGE_KEYS } from '../utils/storage'

const Navbar = ({ setUser }) => {
    const location = useLocation()

    const handleLogout = () => {
        setUser(null)
        saveToStorage(STORAGE_KEYS.USER, null)
        // Optional: Clear session data if needed
    }

    const isActive = (path) => location.pathname === path

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/quest', label: 'Quest', icon: '⚔️' },
        { path: '/customize', label: 'Avatar', icon: '👤' },
    ]

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 left-0 right-0 z-50 px-4 py-4"
        >
            <div className="max-w-4xl mx-auto bg-obsidian/80 backdrop-blur-md border border-neon-blue rounded-full px-6 py-3 shadow-neon flex items-center justify-between">

                {/* Logo */}
                <div className="text-xl font-bold bg-gradient-to-r from-neon-blue to-cyan-300 bg-clip-text text-transparent drop-shadow-neon">
                    FOCUS QUEST
                </div>

                {/* Links */}
                <div className="flex items-center gap-1 md:gap-4">
                    {navLinks.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`relative px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${isActive(link.path)
                                    ? 'text-obsidian bg-neon-blue shadow-[0_0_10px_#0ea5e9]'
                                    : 'text-sky-300 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            <span className="mr-2">{link.icon}</span>
                            <span className="hidden md:inline">{link.label}</span>
                        </Link>
                    ))}
                </div>

                {/* Logout */}
                <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-sm font-bold"
                >
                    Logout
                </button>
            </div>
        </motion.nav>
    )
}

export default Navbar
