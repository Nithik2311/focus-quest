import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const CharacterSprite = ({ mousePosition }) => {
  const [eyePosition, setEyePosition] = useState({ left: { x: 0, y: 0 }, right: { x: 0, y: 0 } })
  const svgRef = useRef(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Eye centers adjusted for new head position
    const leftEyeCenterX = 90
    const leftEyeCenterY = 65
    const rightEyeCenterX = 110
    const rightEyeCenterY = 65
    const maxDistance = 2 // Tight movement for pixel art

    const svgX = mousePosition.x + 100
    const svgY = mousePosition.y + 125

    const leftAngle = Math.atan2(svgY - leftEyeCenterY, svgX - leftEyeCenterX)
    const leftMoveX = Math.cos(leftAngle) * maxDistance
    const leftMoveY = Math.sin(leftAngle) * maxDistance

    const rightAngle = Math.atan2(svgY - rightEyeCenterY, svgX - rightEyeCenterX)
    const rightMoveX = Math.cos(rightAngle) * maxDistance
    const rightMoveY = Math.sin(rightAngle) * maxDistance

    setEyePosition({
      left: { x: leftMoveX, y: leftMoveY },
      right: { x: rightMoveX, y: rightMoveY },
    })
  }, [mousePosition])

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        width="280"
        height="350"
        viewBox="0 0 200 250"
        className="drop-shadow-2xl"
        shapeRendering="crispEdges"
      >
        {/* === AURA === */}
        <motion.circle
          cx="100"
          cy="125"
          r="90"
          fill="none"
          stroke="#FFD700"
          strokeWidth="2"
          strokeDasharray="4 4"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          opacity="0.3"
        />

        {/* === LEGS & BOOTS === */}
        {/* Left Leg Base */}
        <rect x="70" y="160" width="25" height="40" fill="#3E2723" /> {/* Dark Brown Pants */}
        <rect x="70" y="160" width="5" height="40" fill="#2D1B18" opacity="0.4" /> {/* Leg Shadow L */}

        {/* Right Leg Base */}
        <rect x="105" y="160" width="25" height="40" fill="#3E2723" />
        <rect x="125" y="160" width="5" height="40" fill="#2D1B18" opacity="0.4" /> {/* Leg Shadow R */}

        {/* Crotch */}
        <rect x="90" y="160" width="20" height="25" fill="#3E2723" />
        <rect x="90" y="170" width="20" height="5" fill="#2D1B18" opacity="0.2" /> {/* Shadow */}

        {/* Boots */}
        <rect x="68" y="200" width="29" height="40" fill="#1F1209" /> {/* Boot L */}
        <rect x="103" y="200" width="29" height="40" fill="#1F1209" /> {/* Boot R */}

        {/* Boot Highlights */}
        <rect x="70" y="200" width="5" height="15" fill="#5D4037" opacity="0.5" />
        <rect x="105" y="200" width="5" height="15" fill="#5D4037" opacity="0.5" />

        {/* Boot Cuffs */}
        <rect x="66" y="195" width="33" height="8" fill="#5D4037" />
        <rect x="101" y="195" width="33" height="8" fill="#5D4037" />

        {/* === TORSO === */}
        {/* Main Body (Tan) */}
        <rect x="60" y="80" width="80" height="80" fill="#E0AC69" rx="2" />

        {/* Muscle Definition (Shadows & Highlights) */}
        <rect x="60" y="80" width="5" height="80" fill="#C69458" opacity="0.5" /> {/* Side Shadow L */}
        <rect x="135" y="80" width="5" height="80" fill="#C69458" opacity="0.5" /> {/* Side Shadow R */}

        <rect x="75" y="100" width="50" height="2" fill="#C69458" opacity="0.6" /> {/* Pec Line */}
        <rect x="98" y="100" width="4" height="45" fill="#C69458" opacity="0.4" /> {/* Abs Line */}

        <rect x="80" y="115" width="15" height="2" fill="#C69458" opacity="0.3" /> {/* Ab 1 L */}
        <rect x="105" y="115" width="15" height="2" fill="#C69458" opacity="0.3" /> {/* Ab 1 R */}
        <rect x="80" y="130" width="15" height="2" fill="#C69458" opacity="0.3" /> {/* Ab 2 L */}
        <rect x="105" y="130" width="15" height="2" fill="#C69458" opacity="0.3" /> {/* Ab 2 R */}

        {/* === SASH (White) === */}
        <path d="M 60 80 L 140 160 L 140 135 L 85 80 Z" fill="#F5F5F5" />
        <path d="M 60 80 L 140 160 L 140 155 L 65 80 Z" fill="#E0E0E0" opacity="0.5" /> {/* Sash Shadow */}

        {/* === BELT === */}
        <rect x="60" y="155" width="80" height="15" fill="#2D1B18" />
        <rect x="60" y="155" width="80" height="3" fill="#3E2723" opacity="0.5" /> {/* Belt Highlight */}

        {/* Gold Buckle */}
        <rect x="90" y="152" width="20" height="20" fill="#FFD700" />
        <rect x="92" y="154" width="16" height="16" fill="none" stroke="#B8860B" strokeWidth="2" />
        <rect x="95" y="157" width="10" height="10" fill="#FCEda5" opacity="0.8" /> {/* Buckle Shine */}

        {/* === ARMS === */}
        {/* Left Arm */}
        <rect x="35" y="90" width="25" height="70" fill="#E0AC69" rx="2" />
        <rect x="55" y="90" width="5" height="70" fill="#C69458" opacity="0.5" /> {/* Arm Shadow */}
        <rect x="35" y="140" width="25" height="20" fill="#3E2723" /> {/* Wristband */}
        <rect x="35" y="160" width="25" height="15" fill="#E0AC69" /> {/* Hand */}

        {/* Right Arm */}
        <rect x="140" y="90" width="25" height="70" fill="#E0AC69" rx="2" />
        <rect x="140" y="90" width="5" height="70" fill="#C69458" opacity="0.5" /> {/* Arm Shadow */}
        <rect x="140" y="140" width="25" height="20" fill="#3E2723" /> {/* Wristband */}
        <rect x="140" y="160" width="25" height="15" fill="#E0AC69" /> {/* Hand */}

        {/* === HEAD === */}
        {/* Face */}
        <rect x="70" y="30" width="60" height="60" fill="#E0AC69" />

        {/* Beard Base */}
        <rect x="70" y="70" width="60" height="20" fill="#1A1A1A" />
        <rect x="75" y="85" width="50" height="8" fill="#1A1A1A" />

        {/* Mustache */}
        <rect x="82" y="65" width="36" height="8" fill="#1A1A1A" />

        {/* Mouth (Hidden/Serious) */}
        <rect x="92" y="76" width="16" height="2" fill="#000000" opacity="0.6" />

        {/* Hair */}
        <rect x="68" y="20" width="64" height="25" fill="#1A1A1A" /> {/* Top Block */}
        <rect x="68" y="20" width="8" height="60" fill="#1A1A1A" /> {/* Sideburns L */}
        <rect x="124" y="20" width="8" height="60" fill="#1A1A1A" /> {/* Sideburns R */}
        <rect x="90" y="10" width="20" height="15" fill="#1A1A1A" /> {/* Spiky Top */}

        {/* Hair Highlight */}
        <rect x="75" y="22" width="50" height="5" fill="#333333" opacity="0.5" />

        {/* Eyes (Sclera) */}
        <rect x="85" y="60" width="12" height="10" fill="#FFFFFF" />
        <rect x="103" y="60" width="12" height="10" fill="#FFFFFF" />

        {/* Pupils (Tracking) */}
        <rect
          x={88 + eyePosition.left.x}
          y={62 + eyePosition.left.y}
          width="6"
          height="6"
          fill="#000000"
        />
        <rect
          x={106 + eyePosition.right.x}
          y={62 + eyePosition.right.y}
          width="6"
          height="6"
          fill="#000000"
        />

        {/* Eyebrows */}
        <rect x="82" y="54" width="18" height="6" fill="#1A1A1A" />
        <rect x="100" y="54" width="18" height="6" fill="#1A1A1A" />

        {/* Nose */}
        <rect x="98" y="70" width="4" height="6" fill="#C69458" />
        <rect x="98" y="70" width="2" height="6" fill="#A67C52" opacity="0.5" /> {/* Nose Shadow */}

      </svg>
    </div>
  )
}

export default CharacterSprite
