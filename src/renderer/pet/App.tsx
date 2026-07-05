import { useCallback, useEffect, useRef, useState } from 'react'

const DRAG_THRESHOLD_PX = 5

function App(): React.JSX.Element {
  const draggingRef = useRef(false)
  const movedRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

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
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        WebkitUserSelect: 'none'
      }}
    >
      {/* placeholder のびちゃん — replaced by real sprite animation in M2 */}
      <div
        style={{
          width: 140,
          height: 140,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 35% 30%, #fff6d8, #ffd76e 55%, #f4b400 100%)',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 48
        }}
      >
        🌱
      </div>
    </div>
  )
}

export default App
