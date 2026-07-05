import { useEffect, useMemo, useState } from 'react'
import type { Plan, PlanInput, PlanType } from '../../../../shared/types'

const TYPE_LABELS: Record<PlanType, string> = {
  daily: '每日任务',
  weekly: '每周任务',
  countdown: '长期目标 / 倒计时',
  one_off: '临时待办'
}

const TYPE_ORDER: PlanType[] = ['daily', 'weekly', 'countdown', 'one_off']
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysUntil(targetDate: string): number {
  const target = new Date(`${targetDate}T00:00:00`)
  const now = new Date(`${todayStr()}T00:00:00`)
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

interface EditDraft {
  title: string
  note: string
  weekdays: number[]
  targetDate: string
}

function toDraft(plan: Plan): EditDraft {
  return {
    title: plan.title,
    note: plan.note ?? '',
    weekdays: plan.weekdays ?? [],
    targetDate: plan.targetDate ?? ''
  }
}

export function PlansPage(): React.JSX.Element {
  const [plans, setPlans] = useState<Plan[]>([])
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  const [newType, setNewType] = useState<PlanType>('daily')
  const [newTitle, setNewTitle] = useState('')
  const [newNote, setNewNote] = useState('')
  const [newWeekdays, setNewWeekdays] = useState<number[]>([])
  const [newTargetDate, setNewTargetDate] = useState('')

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)

  const today = useMemo(() => todayStr(), [])

  async function reload(): Promise<void> {
    const [planList, checkIns] = await Promise.all([
      window.api.plans.list(),
      window.api.checkIns.listForDate(today)
    ])
    setPlans(planList)
    setCheckedInIds(new Set(checkIns.map((c) => c.planId)))
    setLoading(false)
  }

  useEffect(() => {
    let ignore = false
    Promise.all([window.api.plans.list(), window.api.checkIns.listForDate(today)]).then(
      ([planList, checkIns]) => {
        if (ignore) return
        setPlans(planList)
        setCheckedInIds(new Set(checkIns.map((c) => c.planId)))
        setLoading(false)
      }
    )
    return () => {
      ignore = true
    }
  }, [today])

  async function handleCreate(): Promise<void> {
    if (!newTitle.trim()) return
    const input: PlanInput = {
      type: newType,
      title: newTitle.trim(),
      note: newNote.trim() || null,
      weekdays: newType === 'weekly' ? newWeekdays : null,
      targetDate: newType === 'countdown' ? newTargetDate || null : null
    }
    if (newType === 'countdown' && !newTargetDate) return
    await window.api.plans.create(input)
    setNewTitle('')
    setNewNote('')
    setNewWeekdays([])
    setNewTargetDate('')
    await reload()
  }

  async function handleToggleCheckIn(planId: number): Promise<void> {
    await window.api.checkIns.toggle(planId, today)
    await reload()
  }

  async function handleToggleDone(plan: Plan): Promise<void> {
    await window.api.plans.setDone(plan.id, !plan.isDone)
    await reload()
  }

  async function handleDelete(id: number): Promise<void> {
    await window.api.plans.delete(id)
    await reload()
  }

  function startEdit(plan: Plan): void {
    setEditingId(plan.id)
    setEditDraft(toDraft(plan))
  }

  function cancelEdit(): void {
    setEditingId(null)
    setEditDraft(null)
  }

  async function saveEdit(plan: Plan): Promise<void> {
    if (!editDraft || !editDraft.title.trim()) return
    await window.api.plans.update(plan.id, {
      title: editDraft.title.trim(),
      note: editDraft.note.trim() || null,
      weekdays: plan.type === 'weekly' ? editDraft.weekdays : null,
      targetDate: plan.type === 'countdown' ? editDraft.targetDate || null : null
    })
    cancelEdit()
    await reload()
  }

  function toggleWeekday(list: number[], day: number, setList: (next: number[]) => void): void {
    setList(list.includes(day) ? list.filter((d) => d !== day) : [...list, day].sort())
  }

  if (loading) return <p>加载中...</p>

  return (
    <div>
      <section
        style={{
          border: '1px solid #e0e0e0',
          borderRadius: 10,
          padding: 16,
          marginBottom: 24,
          background: '#fafafa'
        }}
      >
        <h2 style={{ fontSize: 16, marginTop: 0 }}>+ 添加计划</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={newType} onChange={(e) => setNewType(e.target.value as PlanType)}>
            {TYPE_ORDER.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABELS[t]}
              </option>
            ))}
          </select>
          <input
            placeholder="标题"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: 6 }}
          />
          <input
            placeholder="备注（可选）"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            style={{ flex: 1, minWidth: 160, padding: 6 }}
          />
        </div>

        {newType === 'weekly' && (
          <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
            {WEEKDAY_LABELS.map((label, day) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleWeekday(newWeekdays, day, setNewWeekdays)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  border: '1px solid #ccc',
                  background: newWeekdays.includes(day) ? '#6fbf73' : '#fff',
                  color: newWeekdays.includes(day) ? '#fff' : '#333',
                  cursor: 'pointer'
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {newType === 'countdown' && (
          <div style={{ marginTop: 8 }}>
            <input
              type="date"
              value={newTargetDate}
              onChange={(e) => setNewTargetDate(e.target.value)}
              style={{ padding: 6 }}
            />
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button
            onClick={handleCreate}
            style={{
              padding: '6px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#4fa955',
              color: '#fff',
              cursor: 'pointer'
            }}
          >
            添加
          </button>
        </div>
      </section>

      {TYPE_ORDER.map((type) => {
        const group = plans.filter((p) => p.type === type)
        return (
          <section key={type} style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 15, color: '#555' }}>{TYPE_LABELS[type]}</h2>
            {group.length === 0 && <p style={{ color: '#999', fontSize: 13 }}>暂无计划</p>}
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {group.map((plan) => {
                const isEditing = editingId === plan.id
                return (
                  <li
                    key={plan.id}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      padding: '8px 10px',
                      border: '1px solid #eee',
                      borderRadius: 8,
                      marginBottom: 6,
                      background: '#fff'
                    }}
                  >
                    {(type === 'daily' || type === 'weekly') && (
                      <input
                        type="checkbox"
                        checked={checkedInIds.has(plan.id)}
                        onChange={() => handleToggleCheckIn(plan.id)}
                        style={{ marginTop: 4 }}
                      />
                    )}
                    {(type === 'countdown' || type === 'one_off') && (
                      <input
                        type="checkbox"
                        checked={plan.isDone}
                        onChange={() => handleToggleDone(plan)}
                        style={{ marginTop: 4 }}
                      />
                    )}

                    <div style={{ flex: 1 }}>
                      {isEditing && editDraft ? (
                        <div>
                          <input
                            value={editDraft.title}
                            onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })}
                            style={{ padding: 4, marginRight: 6 }}
                          />
                          <input
                            placeholder="备注"
                            value={editDraft.note}
                            onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })}
                            style={{ padding: 4 }}
                          />
                          {type === 'weekly' && (
                            <div style={{ marginTop: 6, display: 'flex', gap: 4 }}>
                              {WEEKDAY_LABELS.map((label, day) => (
                                <button
                                  key={day}
                                  type="button"
                                  onClick={() =>
                                    toggleWeekday(editDraft.weekdays, day, (next) =>
                                      setEditDraft({ ...editDraft, weekdays: next })
                                    )
                                  }
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    border: '1px solid #ccc',
                                    background: editDraft.weekdays.includes(day)
                                      ? '#6fbf73'
                                      : '#fff',
                                    color: editDraft.weekdays.includes(day) ? '#fff' : '#333',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          )}
                          {type === 'countdown' && (
                            <input
                              type="date"
                              value={editDraft.targetDate}
                              onChange={(e) =>
                                setEditDraft({ ...editDraft, targetDate: e.target.value })
                              }
                              style={{ marginTop: 6, padding: 4 }}
                            />
                          )}
                        </div>
                      ) : (
                        <div>
                          <div
                            style={{
                              fontWeight: 500,
                              textDecoration: plan.isDone ? 'line-through' : 'none',
                              color: plan.isDone ? '#999' : '#333'
                            }}
                          >
                            {plan.title}
                          </div>
                          {plan.note && (
                            <div style={{ fontSize: 12, color: '#888' }}>{plan.note}</div>
                          )}
                          {type === 'weekly' && plan.weekdays && plan.weekdays.length > 0 && (
                            <div style={{ fontSize: 12, color: '#6fbf73' }}>
                              每周 {plan.weekdays.map((d) => WEEKDAY_LABELS[d]).join('、')}
                            </div>
                          )}
                          {type === 'countdown' && plan.targetDate && (
                            <div style={{ fontSize: 12, color: '#e08a3c' }}>
                              目标日期 {plan.targetDate}（
                              {daysUntil(plan.targetDate) >= 0
                                ? `还剩 ${daysUntil(plan.targetDate)} 天`
                                : `已过期 ${-daysUntil(plan.targetDate)} 天`}
                              ）
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => saveEdit(plan)}
                            style={smallButtonStyle('#4fa955', '#fff')}
                          >
                            保存
                          </button>
                          <button onClick={cancelEdit} style={smallButtonStyle('#fff', '#333')}>
                            取消
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(plan)}
                            style={smallButtonStyle('#fff', '#333')}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            style={smallButtonStyle('#fff', '#c0392b')}
                          >
                            删除
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

function smallButtonStyle(background: string, color: string): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 6,
    border: '1px solid #ccc',
    background,
    color,
    cursor: 'pointer',
    fontSize: 12,
    height: 'fit-content'
  }
}
