import React, { useState } from 'react'
import { motion } from 'framer-motion'

const StudyModal = ({ url, onClose, onOpenExternal }) => {
    const [loading, setLoading] = useState(true)

    // Helper to convert URLs to embeddable versions
    const getEmbedUrl = (originalUrl) => {
        try {
            let urlObj = new URL(originalUrl);

            // 1. Handle YouTube
            if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
                // Handle shortened youtu.be/ID
                if (urlObj.hostname.includes('youtu.be')) {
                    return `https://www.youtube.com/embed${urlObj.pathname}`;
                }
                // Handle standard watch?v=ID
                if (urlObj.searchParams.has('v')) {
                    return `https://www.youtube.com/embed/${urlObj.searchParams.get('v')}`;
                }
            }

            // 2. Handle Vimeo
            if (urlObj.hostname.includes('vimeo.com')) {
                // Basic vimeo ID extraction: vimeo.com/12345
                const id = urlObj.pathname.split('/')[1];
                if (id && /^\d+$/.test(id)) {
                    return `https://player.vimeo.com/video/${id}`;
                }
            }

            return originalUrl;
        } catch (e) {
            return originalUrl;
        }
    }

    const embedUrl = getEmbedUrl(url);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative w-full h-full max-w-6xl max-h-[90vh] bg-obsidian border border-neon-blue rounded-xl shadow-neon overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 bg-slate-900 border-b border-slate-700">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                        <h3 className="text-white font-bold truncate text-sm md:text-base mr-2">{url}</h3>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={() => onOpenExternal(url)}
                            className="px-3 py-1.5 text-xs md:text-sm font-bold bg-green-600 text-white rounded hover:bg-green-500 transition-colors shadow-[0_0_10px_rgba(22,163,74,0.4)] border border-green-400"
                        >
                            Open External (Fallback)
                        </button>
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 text-xs md:text-sm font-bold bg-slate-700 text-gray-200 rounded hover:bg-slate-600 transition-colors border border-slate-500"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 relative bg-white">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-slate-900 font-mono">
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-6 h-6 border-b-2 border-black rounded-full animate-spin"></div>
                                <p>Loading Resource via Secure Link...</p>
                            </div>
                        </div>
                    )}
                    <iframe
                        src={embedUrl}
                        className="w-full h-full border-0 block"
                        onLoad={() => setLoading(false)}
                        title="Study Resource"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
                    />

                </div>
            </motion.div>

            {/* Minimalist Fallback Hint below the modal */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-mono tracking-widest uppercase">
                If too slow, use External (Safe) ↑
            </div>
        </div>
    )
}

export default StudyModal
