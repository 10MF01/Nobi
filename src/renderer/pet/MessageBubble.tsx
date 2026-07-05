import { AnimatePresence, motion } from 'framer-motion'

interface MessageBubbleProps {
  message: string | null
}

export function MessageBubble({ message }: MessageBubbleProps): React.JSX.Element {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          key={message}
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.92 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: 6,
            maxWidth: 220,
            padding: '8px 12px',
            borderRadius: 14,
            background: 'rgba(255, 255, 255, 0.96)',
            boxShadow: '0 4px 14px rgba(63, 155, 84, 0.22)',
            fontSize: 13,
            lineHeight: 1.4,
            color: '#2f3a2c',
            textAlign: 'center',
            whiteSpace: 'normal',
            pointerEvents: 'none'
          }}
        >
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
