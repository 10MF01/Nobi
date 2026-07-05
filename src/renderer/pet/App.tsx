import { useCallback, useEffect, useRef, useState } from 'react'
import { PetCharacter } from './PetCharacter'
import { MessageBubble } from './MessageBubble'
import type { EmotionState } from '../../../shared/types'

const DRAG_THRESHOLD_PX = 5

function App(): React.JSX.Element {
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [emotion, setEmotion] = useState<EmotionState>('idle')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    let revertTimer: ReturnType<typeof setTimeout> | undefined

    const unsubscribe = window.api.pet.onReaction(
      ({ emotion: nextEmotion, durationMs, message: nextMessage }) => {
        clearTimeout(revertTimer)
        setEmotion(nextEmotion)
        setMessage(nextMessage ?? null)
        revertTimer = setTimeout(() => {
          setEmotion('idle')
          setMessage(null)
        }, durationMs)
      }
    )

    return () => {
      clearTimeout(revertTimer)
      unsubscribe()
    }
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    draggingRef.current = true
    movedRef.current = false
    dragStartRef.current = { x: e.screenX, y: e.screenY }
    window.api.pet.dragStart()
    setIsDragging(true)
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent): void => {
      if (!draggingRef.current) return
      const dx = e.screenX - dragStartRef.current.x
      const dy = e.screenY - dragStartRef.current.y
      if (Math.abs(dx) > DRAG_THRESHOLD_PX || Math.abs(dy) > DRAG_THRESHOLD_PX) {
        movedRef.current = true
      }
      if (movedRef.current) {
        window.api.pet.dragMove(dx, dy)
      }
    }

    const handleMouseUp = (): void => {
      if (draggingRef.current && !movedRef.current) {
        window.api.pet.click()
      }
      draggingRef.current = false
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    window.api.panel.open()
  }, [])

  return (
    <div
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      <div style={{ width: 160, height: 160, position: 'relative' }}>
        <MessageBubble message={message} />
        <PetCharacter emotion={emotion} />
      </div>
    </div>
  )
}

export default App
