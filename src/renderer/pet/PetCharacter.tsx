import { motion, type Variants } from 'framer-motion'
import type { EmotionState } from '../../../shared/types'

interface PetCharacterProps {
  emotion: EmotionState
}

const bodyVariants: Variants = {
  idle: {
    y: [0, -6, 0],
    rotate: 0,
    transition: { duration: 2.6, repeat: Infinity, ease: 'easeInOut' }
  },
  happy: {
    y: [0, -22, 0],
    rotate: [0, -5, 5, 0],
    transition: { duration: 0.55, repeat: Infinity, ease: 'easeOut' }
  },
  comfort: {
    y: [0, -3, 0],
    rotate: [-4, 4, -4],
    transition: { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
  },
  stern: {
    x: [0, -7, 7, -7, 7, 0],
    y: 0,
    rotate: 0,
    transition: { duration: 0.5, ease: 'easeInOut' }
  }
}

function Eyes({ emotion }: { emotion: EmotionState }): React.JSX.Element {
  if (emotion === 'happy') {
    return (
      <g stroke="#3a2e1f" strokeWidth={5} strokeLinecap="round" fill="none">
        <path d="M 68 96 Q 78 84 88 96" />
        <path d="M 112 96 Q 122 84 132 96" />
      </g>
    )
  }
  if (emotion === 'comfort') {
    return (
      <g stroke="#3a2e1f" strokeWidth={4} strokeLinecap="round" fill="none">
        <path d="M 66 98 Q 78 102 90 98" />
        <path d="M 110 98 Q 122 102 134 98" />
      </g>
    )
  }
  if (emotion === 'stern') {
    return (
      <g>
        <ellipse cx="78" cy="98" rx="9" ry="11" fill="#3a2e1f" />
        <ellipse cx="122" cy="98" rx="9" ry="11" fill="#3a2e1f" />
        <path
          d="M 66 84 L 90 90"
          stroke="#3a2e1f"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M 134 84 L 110 90"
          stroke="#3a2e1f"
          strokeWidth={5}
          strokeLinecap="round"
          fill="none"
        />
      </g>
    )
  }
  // idle — includes a periodic blink
  return (
    <motion.g
      animate={{ scaleY: [1, 1, 1, 0.1, 1] }}
      transition={{ duration: 4, repeat: Infinity, times: [0, 0.85, 0.9, 0.95, 1] }}
      style={{ originX: '100px', originY: '98px' }}
    >
      <ellipse cx="78" cy="98" rx="10" ry="12" fill="#3a2e1f" />
      <ellipse cx="122" cy="98" rx="10" ry="12" fill="#3a2e1f" />
      <circle cx="81.5" cy="93.5" r="2.6" fill="#fff" />
      <circle cx="125.5" cy="93.5" r="2.6" fill="#fff" />
    </motion.g>
  )
}

function Mouth({ emotion }: { emotion: EmotionState }): React.JSX.Element {
  if (emotion === 'happy') {
    return <path d="M 84 116 Q 100 138 116 116 Q 100 126 84 116 Z" fill="#a8452f" />
  }
  if (emotion === 'comfort') {
    return (
      <path
        d="M 88 116 Q 100 124 112 116"
        stroke="#a8452f"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    )
  }
  if (emotion === 'stern') {
    return (
      <path
        d="M 88 122 Q 100 114 112 122"
        stroke="#a8452f"
        strokeWidth={4}
        strokeLinecap="round"
        fill="none"
      />
    )
  }
  return (
    <path
      d="M 90 114 Q 100 122 110 114"
      stroke="#a8452f"
      strokeWidth={4}
      strokeLinecap="round"
      fill="none"
    />
  )
}

export function PetCharacter({ emotion }: PetCharacterProps): React.JSX.Element {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {emotion === 'comfort' && (
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.08, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            margin: 'auto',
            width: 150,
            height: 150,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,196,214,0.55), transparent 70%)'
          }}
        />
      )}

      {emotion === 'happy' &&
        [0, 1, 2, 3].map((i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0, y: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6], y: -30 }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${18 + i * 22}%`,
              top: '10%',
              fontSize: 16,
              pointerEvents: 'none'
            }}
          >
            ✨
          </motion.span>
        ))}

      <motion.svg
        viewBox="0 0 200 200"
        width="100%"
        height="100%"
        variants={bodyVariants}
        animate={emotion}
        style={{ overflow: 'visible' }}
      >
        {/* sprout on head — nods to のびちゃん (伸びる / growth) */}
        <g>
          <path d="M 100 46 C 92 30 70 28 62 34 C 70 46 88 50 100 46 Z" fill="#6fbf73" />
          <path d="M 100 46 C 108 26 128 22 138 30 C 128 44 112 50 100 46 Z" fill="#4fa955" />
        </g>

        {/* body */}
        <ellipse cx="100" cy="120" rx="66" ry="62" fill="#bff0c4" />
        <ellipse cx="100" cy="126" rx="66" ry="52" fill="#d9f7dc" />

        {/* blush */}
        <ellipse cx="64" cy="112" rx="11" ry="7" fill="#ffb3c0" opacity={0.7} />
        <ellipse cx="136" cy="112" rx="11" ry="7" fill="#ffb3c0" opacity={0.7} />

        <Eyes emotion={emotion} />
        <Mouth emotion={emotion} />
      </motion.svg>
    </div>
  )
}
