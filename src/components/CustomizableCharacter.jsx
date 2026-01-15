const CustomizableCharacter = ({ config }) => {
  const {
    gender,
    skinTone,
    hasGlasses,
    glassesColor,
    auraColor,
    auraIntensity,
    hairLength = 'normal',
    hairColor = '#2D1B18',
    hasBeard = false,
    armorType = 'basic',
  } = config

  const isMale = gender === 'masculine'
  const shoulderWidth = isMale ? 80 : 64
  const torsoX = isMale ? 60 : 68

  // Colors
  const shadowColor = "#C69458"

  // --- ARMOR RENDERERS ---
  const renderArmor = () => {
    switch (armorType) {
      case 'rogue':
        return (
          <g id="armor-rogue">
            {/* Torso */}
            <rect x={torsoX} y="80" width={shoulderWidth} height="80" fill="#2D1B18" rx="2" />
            <rect x={torsoX + 10} y="80" width={shoulderWidth - 20} height="80" fill="#3E2723" />
            {/* Cross Belt */}
            <line x1={torsoX} y1="80" x2={torsoX + shoulderWidth} y2="160" stroke="#1A120B" strokeWidth="5" />
            {/* Legs */}
            <rect x="75" y="160" width="20" height="40" fill="#1A120B" />
            <rect x="105" y="160" width="20" height="40" fill="#1A120B" />
            <rect x="90" y="160" width="20" height="15" fill="#1A120B" />
          </g>
        )
      case 'knight':
        return (
          <g id="armor-knight">
            {/* Torso - Plate */}
            <rect x={torsoX - 5} y="78" width={shoulderWidth + 10} height="85" fill="#94A3B8" rx="2" stroke="#475569" />
            <rect x={torsoX + 10} y="85" width={shoulderWidth - 20} height="70" fill="#CBD5E1" opacity="0.3" />
            {/* Shoulder Pads */}
            <circle cx={torsoX} cy="80" r="12" fill="#64748B" />
            <circle cx={torsoX + shoulderWidth} cy="80" r="12" fill="#64748B" />
            {/* Legs - Greaves */}
            <rect x="75" y="160" width="20" height="40" fill="#475569" />
            <rect x="105" y="160" width="20" height="40" fill="#475569" />
            <rect x="75" y="180" width="20" height="20" fill="#94A3B8" /> {/* Knee */}
            <rect x="105" y="180" width="20" height="20" fill="#94A3B8" />
            <rect x="90" y="160" width="20" height="15" fill="#475569" />
          </g>
        )
      case 'mage':
        return (
          <g id="armor-mage">
            {/* Robe Body */}
            <path d={`M ${torsoX} 80 L ${torsoX - 10} 220 L ${torsoX + shoulderWidth + 10} 220 L ${torsoX + shoulderWidth} 80 Z`} fill="#4C1D95" />
            <path d={`M ${torsoX + 10} 80 L ${torsoX + 5} 220 L ${torsoX + shoulderWidth - 5} 220 L ${torsoX + shoulderWidth - 10} 80 Z`} fill="#5B21B6" />
            {/* Sash */}
            <rect x={torsoX - 5} y="140" width={shoulderWidth + 10} height="10" fill="#F59E0B" />
            {/* Legs (Hidden but base needed) */}
            <rect x="75" y="160" width="20" height="40" fill="#2E1065" />
            <rect x="105" y="160" width="20" height="40" fill="#2E1065" />
          </g>
        )
      case 'cyber':
        return (
          <g id="armor-cyber">
            {/* Torso Suit */}
            <rect x={torsoX} y="80" width={shoulderWidth} height="80" fill="#0F172A" rx="2" />
            {/* Neon Lines */}
            <path d={`M ${torsoX + 5} 80 V 160`} stroke="#0ea5e9" strokeWidth="2" className="animate-pulse" />
            <path d={`M ${torsoX + shoulderWidth - 5} 80 V 160`} stroke="#0ea5e9" strokeWidth="2" className="animate-pulse" />
            {/* Core */}
            <circle cx="100" cy="110" r="8" fill="#06b6d4" className="animate-pulse-slow" filter="drop-shadow(0 0 5px #06b6d4)" />
            {/* Legs */}
            <rect x="75" y="160" width="20" height="40" fill="#0F172A" />
            <rect x="105" y="160" width="20" height="40" fill="#0F172A" />
            <rect x="90" y="160" width="20" height="15" fill="#0F172A" />
            <rect x="78" y="170" width="14" height="2" fill="#0ea5e9" />
            <rect x="108" y="170" width="14" height="2" fill="#0ea5e9" />
          </g>
        )
      case 'barbarian':
        return (
          <g id="armor-barbarian">
            {/* Bare Chest with Harness */}
            <rect x={torsoX} y="80" width={shoulderWidth} height="80" fill={skinTone} rx="2" />
            <path d={`M ${torsoX} 80 L ${torsoX + shoulderWidth} 160`} stroke="#3E2723" strokeWidth="5" />
            <path d={`M ${torsoX + shoulderWidth} 80 L ${torsoX} 160`} stroke="#3E2723" strokeWidth="5" />
            {/* Belt */}
            <rect x={torsoX - 5} y="150" width={shoulderWidth + 10} height="15" fill="#3E2723" />
            {/* Loincloth */}
            <path d="M 75 160 L 125 160 L 115 200 L 85 200 Z" fill="#5D4037" />
            <rect x="75" y="160" width="20" height="40" fill={skinTone} /> {/* Legs */}
            <rect x="105" y="160" width="20" height="40" fill={skinTone} />
          </g>
        )
      case 'barbarianKing':
        return (
          <g id="armor-barbarian-king">
            {/* Red Cape */}
            <path d={`M ${torsoX} 85 L ${torsoX - 20} 200 L ${torsoX + shoulderWidth + 20} 200 L ${torsoX + shoulderWidth} 85 Z`} fill="#7f1d1d" />
            {/* Bare Chest with Golden Harness */}
            <rect x={torsoX} y="80" width={shoulderWidth} height="80" fill={skinTone} rx="2" />
            <path d={`M ${torsoX} 80 L ${torsoX + shoulderWidth} 160`} stroke="#FFD700" strokeWidth="6" />
            <path d={`M ${torsoX + shoulderWidth} 80 L ${torsoX} 160`} stroke="#FFD700" strokeWidth="6" />
            {/* Golden Belt */}
            <rect x={torsoX - 5} y="150" width={shoulderWidth + 10} height="20" fill="#FFD700" />
            <circle cx="100" cy="160" r="10" fill="#D4AF37" stroke="#FFF" strokeWidth="1" />
            {/* Legs */}
            <rect x="75" y="160" width="20" height="40" fill={skinTone} />
            <rect x="105" y="160" width="20" height="40" fill={skinTone} />
            <rect x="75" y="180" width="20" height="20" fill="#5D4037" /> {/* Boots */}
            <rect x="105" y="180" width="20" height="20" fill="#5D4037" />
          </g>
        )
      case 'king':
        return (
          <g id="armor-king">
            {/* Royal Robes */}
            <rect x={torsoX - 5} y="80" width={shoulderWidth + 10} height="120" fill="#4C1D95" rx="5" />
            <rect x={torsoX} y="80" width={shoulderWidth} height="120" fill="#5B21B6" />
            {/* Ermine Trim (White/Black spots) */}
            <rect x={torsoX + 20} y="80" width="20" height="120" fill="white" />
            <circle cx="100" cy="100" r="2" fill="black" />
            <circle cx="100" cy="120" r="2" fill="black" />
            <circle cx="100" cy="140" r="2" fill="black" />
            <circle cx="100" cy="160" r="2" fill="black" />
            {/* Chain */}
            <path d={`M ${torsoX} 80 Q 100 120 ${torsoX + shoulderWidth} 80`} fill="none" stroke="#FFD700" strokeWidth="3" />
          </g>
        )
      case 'queen':
        return (
          <g id="armor-queen">
            {/* Dress Body */}
            <path d={`M ${torsoX} 80 L ${torsoX - 15} 220 L ${torsoX + shoulderWidth + 15} 220 L ${torsoX + shoulderWidth} 80 Z`} fill="#BE185D" />
            {/* Corset Detail */}
            <path d={`M ${torsoX + 10} 80 L ${torsoX + 15} 140 L ${torsoX + shoulderWidth - 15} 140 L ${torsoX + shoulderWidth - 10} 80 Z`} fill="#9D174D" />
            {/* Gold Trims */}
            <rect x={torsoX - 5} y="140" width={shoulderWidth + 10} height="5" fill="#FFD700" />
          </g>
        )
      case 'angel':
        return (
          <g id="armor-angel">
            {/* Wings (Behind - tricky with Z-index here, usually needs separate group, but simple approximation) */}
            <path d="M 60 90 Q 20 60 10 120 Q 20 160 50 140" fill="white" stroke="#E2E8F0" strokeWidth="2" />
            <path d="M 140 90 Q 180 60 190 120 Q 180 160 150 140" fill="white" stroke="#E2E8F0" strokeWidth="2" />
            {/* Robe */}
            <path d={`M ${torsoX} 80 L ${torsoX - 10} 220 L ${torsoX + shoulderWidth + 10} 220 L ${torsoX + shoulderWidth} 80 Z`} fill="#F8FAFC" />
            <path d={`M ${torsoX} 80 L ${torsoX + shoulderWidth} 160 L ${torsoX} 160 Z`} fill="white" opacity="0.5" />
            {/* Halo Ring (Gold) */}
            <ellipse cx="100" cy="25" rx="30" ry="5" fill="none" stroke="#FCD34D" strokeWidth="3" />
          </g>
        )
      case 'fairyQueen':
        return (
          <g id="armor-fairy">
            {/* Wings */}
            <path d="M 60 100 Q 10 70 10 130 Q 30 150 60 140" fill="#A7F3D0" opacity="0.6" stroke="#34D399" />
            <path d="M 140 100 Q 190 70 190 130 Q 170 150 140 140" fill="#A7F3D0" opacity="0.6" stroke="#34D399" />
            {/* Dress */}
            <path d={`M ${torsoX} 80 L ${torsoX - 15} 200 L ${torsoX + shoulderWidth + 15} 200 L ${torsoX + shoulderWidth} 80 Z`} fill="#059669" />
            {/* Leaf details */}
            <circle cx="100" cy="100" r="5" fill="#A7F3D0" />
            <circle cx="100" cy="130" r="5" fill="#A7F3D0" />
            <circle cx="100" cy="160" r="5" fill="#A7F3D0" />
          </g>
        )
      case 'basic':
      default:
        return (
          <g id="armor-basic">
            {/* T-Shirt */}
            <rect x={torsoX} y="80" width={shoulderWidth} height="80" fill={isMale ? "#4B5563" : "#6B7280"} rx="2" />
            <rect x={torsoX + 10} y="80" width={shoulderWidth - 20} height="80" fill="white" opacity="0.05" />
            {/* Jeans */}
            <rect x="75" y="160" width="20" height="40" fill="#374151" />
            <rect x="105" y="160" width="20" height="40" fill="#374151" />
            <rect x="90" y="160" width="20" height="15" fill="#374151" />
          </g>
        )
    }
  }

  // --- HAIR RENDERER ---
  const renderHair = () => {
    if (hairLength === 'none') return null

    if (isMale) {
      if (hairLength === 'long') {
        return (
          <g id="hair-male-long">
            <rect x="65" y="20" width="70" height="25" fill={hairColor} />
            <rect x="65" y="20" width="15" height="70" fill={hairColor} />
            <rect x="120" y="20" width="15" height="70" fill={hairColor} />
            <rect x="90" y="10" width="20" height="15" fill={hairColor} />
          </g>
        )
      }
      return (
        <g id="hair-male-normal">
          <rect x="65" y="20" width="70" height="25" fill={hairColor} />
          <rect x="65" y="20" width="8" height="50" fill={hairColor} />
          <rect x="127" y="20" width="8" height="50" fill={hairColor} />
          <rect x="90" y="10" width="20" height="15" fill={hairColor} />
        </g>
      )
    } else { // Feminine
      const curveRadius = "10"
      if (hairLength === 'long') {
        return (
          <g id="hair-female-long">
            <path d="M 60 20 Q 100 0 140 20 V 120 Q 140 130 130 130 H 120 V 50 H 80 V 130 H 70 Q 60 130 60 120 Z" fill={hairColor} />
            <rect x="70" y="25" width="60" height="5" fill="#4A3B32" opacity="0.5" rx="2" />
          </g>
        )
      }
      return (
        <g id="hair-female-normal">
          <path d="M 60 20 Q 100 0 140 20 V 60 Q 140 80 120 70 V 50 H 80 V 70 Q 60 80 60 60 Z" fill={hairColor} />
          <rect x="70" y="25" width="60" height="5" fill="#4A3B32" opacity="0.5" rx="2" />
        </g>
      )
    }
  }

  return (
    <div className="relative">
      <svg
        width="280"
        height="350"
        viewBox="0 0 200 250"
        className="drop-shadow-2xl"
        shapeRendering="geometricPrecision"
      >
        {/* === AURA === */}
        {auraIntensity > 0 && (
          <circle
            cx="100"
            cy="125"
            r={70 + auraIntensity * 20}
            fill="none"
            stroke={auraColor}
            strokeWidth="3"
            strokeDasharray="4 4"
            opacity={auraIntensity * 0.5}
            className="animate-pulse-slow"
          />
        )}

        {/* === BODY BASE (Behind Armor) === */}
        <g id="body-parts">
          {/* Arms - Rendered before torso for layering */}
          <rect x={torsoX - 25} y="90" width="20" height="70" fill={skinTone} rx="5" />
          <rect x={torsoX + shoulderWidth + 5} y="90" width="20" height="70" fill={skinTone} rx="5" />
        </g>

        {/* === ARMOR & CLOTHES === */}
        {renderArmor()}

        {/* === HEAD === */}
        <rect x="70" y="30" width="60" height="60" fill={skinTone} rx={isMale ? 2 : 15} /> {/* Rounder face for feminine */}
        <rect x="125" y="30" width="5" height="60" fill={shadowColor} opacity="0.3" rx={isMale ? 0 : 5} />

        {/* === EYES === */}
        <rect x="85" y="60" width="10" height="10" fill="white" rx="2" />
        <rect x="105" y="60" width="10" height="10" fill="white" rx="2" />
        <rect x="87" y="62" width="4" height="4" fill="black" rx="1" />
        <rect x="107" y="62" width="4" height="4" fill="black" rx="1" />

        {/* === BEARD (Male Only) === */}
        {isMale && hasBeard && (
          <path d="M 70 65 L 70 90 Q 100 110 130 90 L 130 65 L 125 65 L 125 80 Q 100 95 75 80 L 75 65 Z" fill={hairColor} />
        )}

        {/* === HAIR === */}
        {renderHair()}

        {/* === GLASSES === */}
        {hasGlasses && (
          <g>
            <rect x="82" y="58" width="16" height="14" fill="none" stroke={glassesColor} strokeWidth="3" rx="2" />
            <rect x="102" y="58" width="16" height="14" fill="none" stroke={glassesColor} strokeWidth="3" rx="2" />
            <rect x="98" y="64" width="4" height="2" fill={glassesColor} />
          </g>
        )}

        {/* === MOUTH === */}
        {!hasBeard && (
          <rect x="92" y="80" width="16" height="2" fill="#2D1B18" opacity="0.6" />
        )}

        {/* === HEADGEAR (Crowns) === */}
        {(armorType === 'king' || armorType === 'queen' || armorType === 'barbarianKing') && (
          <g id="crown">
            <path d="M 70 35 L 70 20 L 85 30 L 100 15 L 115 30 L 130 20 L 130 35 Z" fill="#FFD700" stroke="#B45309" strokeWidth="2" />
            <circle cx="70" cy="20" r="3" fill="#EF4444" />
            <circle cx="100" cy="15" r="4" fill="#3B82F6" />
            <circle cx="130" cy="20" r="3" fill="#EF4444" />
          </g>
        )}

      </svg>
    </div>
  )
}

export default CustomizableCharacter
