import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Checkbox,
  DatePicker,
  Empty,
  Form,
  Input,
  List,
  message,
  Modal,
  Popconfirm,
  Select,
  Space,
  Tag,
  Typography
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { Plan, PlanInput, PlanType } from '../../../../shared/types'

const { Text } = Typography

const TYPE_LABELS: Record<PlanType, string> = {
  daily: '每日任务',
  weekly: '每周任务',
  countdown: '长期目标 / 倒计时',
  one_off: '临时待办'
}

const TYPE_ORDER: PlanType[] = ['daily', 'weekly', 'countdown', 'one_off']
const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const DATE_FORMAT = 'YYYY-MM-DD'

function todayStr(): string {
  return dayjs().format(DATE_FORMAT)
}

function daysUntil(targetDate: string): number {
  return dayjs(targetDate).startOf('day').diff(dayjs().startOf('day'), 'day')
}

interface AddFormValues {
  type: PlanType
  title: string
  note?: string
  weekdays?: number[]
  targetDate?: Dayjs
}

interface EditFormValues {
  title: string
  note?: string
  weekdays?: number[]
  targetDate?: Dayjs
}

function isCheckInType(type: PlanType): boolean {
  return type === 'daily' || type === 'weekly'
}

/** 每周任务只在勾选的星期几到期，daily 每天都到期；countdown/one_off 不走这条打卡路径 */
function isDueToday(plan: Plan, todayWeekday: number): boolean {
  if (plan.type === 'daily') return true
  if (plan.type === 'weekly') return plan.weekdays?.includes(todayWeekday) ?? false
  return true
}

export function PlansPage(): React.JSX.Element {
  const [plans, setPlans] = useState<Plan[]>([])
  const [checkedInIds, setCheckedInIds] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

  const [addForm] = Form.useForm<AddFormValues>()
  const [editForm] = Form.useForm<EditFormValues>()
  const addType = Form.useWatch('type', addForm)

  // 面板窗口只是隐藏/显示、从不销毁重建，state 必须自己在跨天时刷新，不能只算一次
  const [today, setToday] = useState(todayStr())
  const todayWeekday = dayjs(today).day()

  useEffect(() => {
    const interval = setInterval(() => {
      const current = todayStr()
      setToday((prev) => (prev === current ? prev : current))
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

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

  async function reload(): Promise<void> {
    const [planList, checkIns] = await Promise.all([
      window.api.plans.list(),
      window.api.checkIns.listForDate(today)
    ])
    setPlans(planList)
    setCheckedInIds(new Set(checkIns.map((c) => c.planId)))
  }

  async function handleCreate(values: AddFormValues): Promise<void> {
    const input: PlanInput = {
      type: values.type,
      title: values.title.trim(),
      note: values.note?.trim() || null,
      weekdays: values.type === 'weekly' ? (values.weekdays ?? []) : null,
      targetDate:
        values.type === 'countdown' ? (values.targetDate?.format(DATE_FORMAT) ?? null) : null
    }
    await window.api.plans.create(input)
    const keepType = values.type
    addForm.resetFields()
    addForm.setFieldValue('type', keepType)
    await reload()
  }

  async function handleToggleCheckIn(planId: number): Promise<void> {
    try {
      await window.api.checkIns.toggle(planId, today)
    } catch {
      message.error('打卡失败，计划可能已被删除')
    }
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

  function openEdit(plan: Plan): void {
    setEditingPlan(plan)
    editForm.setFieldsValue({
      title: plan.title,
      note: plan.note ?? '',
      weekdays: plan.weekdays ?? [],
      targetDate: plan.targetDate ? dayjs(plan.targetDate) : undefined
    })
  }

  async function handleSaveEdit(values: EditFormValues): Promise<void> {
    if (!editingPlan) return
    await window.api.plans.update(editingPlan.id, {
      title: values.title.trim(),
      note: values.note?.trim() || null,
      weekdays: editingPlan.type === 'weekly' ? (values.weekdays ?? []) : null,
      targetDate:
        editingPlan.type === 'countdown' ? (values.targetDate?.format(DATE_FORMAT) ?? null) : null
    })
    setEditingPlan(null)
    await reload()
  }

  if (loading) return <Text type="secondary">加载中...</Text>

  return (
    <div>
      <Card title="+ 添加计划" style={{ marginBottom: 20 }}>
        <Form<AddFormValues>
          form={addForm}
          layout="vertical"
          initialValues={{ type: 'daily', weekdays: [] }}
          onFinish={handleCreate}
        >
          <Space align="start" wrap size={12}>
            <Form.Item name="type" label="类型" style={{ width: 176, marginBottom: 12 }}>
              <Select options={TYPE_ORDER.map((t) => ({ value: t, label: TYPE_LABELS[t] }))} />
            </Form.Item>
            <Form.Item
              name="title"
              label="标题"
              rules={[{ required: true, message: '请输入标题' }]}
              style={{ width: 240, marginBottom: 12 }}
            >
              <Input placeholder="标题" />
            </Form.Item>
            <Form.Item name="note" label="备注（可选）" style={{ width: 240, marginBottom: 12 }}>
              <Input placeholder="备注（可选）" />
            </Form.Item>
          </Space>

          {addType === 'weekly' && (
            <Form.Item
              name="weekdays"
              label="每周星期"
              rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一天' }]}
            >
              <Checkbox.Group>
                <Space wrap>
                  {WEEKDAY_LABELS.map((label, day) => (
                    <Checkbox key={day} value={day}>
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          )}

          {addType === 'countdown' && (
            <Form.Item
              name="targetDate"
              label="目标日期"
              rules={[{ required: true, message: '请选择目标日期' }]}
            >
              <DatePicker />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0 }}>
            <Button type="primary" htmlType="submit">
              添加
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {TYPE_ORDER.map((type) => {
        const group = plans.filter((p) => p.type === type)
        return (
          <Card
            key={type}
            title={`${TYPE_LABELS[type]} (${group.length})`}
            style={{ marginBottom: 16 }}
          >
            {group.length === 0 ? (
              <Empty description="暂无计划" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <List
                dataSource={group}
                renderItem={(plan) => {
                  const checked = isCheckInType(type) ? checkedInIds.has(plan.id) : plan.isDone
                  const dueToday = isDueToday(plan, todayWeekday)
                  return (
                    <List.Item
                      actions={[
                        <Button key="edit" type="text" size="small" onClick={() => openEdit(plan)}>
                          编辑
                        </Button>,
                        <Popconfirm
                          key="delete"
                          title="确定删除这条计划吗？"
                          okText="删除"
                          okButtonProps={{ danger: true }}
                          cancelText="取消"
                          onConfirm={() => handleDelete(plan.id)}
                        >
                          <Button type="text" size="small" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <Space align="start">
                        <Checkbox
                          checked={checked}
                          disabled={isCheckInType(type) && !dueToday}
                          onChange={() =>
                            isCheckInType(type)
                              ? handleToggleCheckIn(plan.id)
                              : handleToggleDone(plan)
                          }
                        />
                        <div>
                          <Text delete={plan.isDone}>{plan.title}</Text>
                          <div style={{ marginTop: 4 }}>
                            {isCheckInType(type) && !dueToday && <Tag>今天无需打卡</Tag>}
                            {plan.note && (
                              <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                                {plan.note}
                              </Text>
                            )}
                            {type === 'weekly' && plan.weekdays && plan.weekdays.length > 0 && (
                              <Tag color="success">
                                每周 {plan.weekdays.map((d) => WEEKDAY_LABELS[d]).join('、')}
                              </Tag>
                            )}
                            {type === 'countdown' && plan.targetDate && (
                              <Space size={4}>
                                <Tag color="success">目标日期 {plan.targetDate}</Tag>
                                <Tag color="warning">
                                  {daysUntil(plan.targetDate) >= 0
                                    ? `还剩 ${daysUntil(plan.targetDate)} 天`
                                    : `已过期 ${-daysUntil(plan.targetDate)} 天`}
                                </Tag>
                              </Space>
                            )}
                          </div>
                        </div>
                      </Space>
                    </List.Item>
                  )
                }}
              />
            )}
          </Card>
        )
      })}

      <Modal
        title="编辑计划"
        open={editingPlan !== null}
        onCancel={() => setEditingPlan(null)}
        onOk={() => editForm.submit()}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form<EditFormValues> form={editForm} layout="vertical" onFinish={handleSaveEdit}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input />
          </Form.Item>
          {editingPlan?.type === 'weekly' && (
            <Form.Item
              name="weekdays"
              label="每周星期"
              rules={[{ required: true, type: 'array', min: 1, message: '请至少选择一天' }]}
            >
              <Checkbox.Group>
                <Space wrap>
                  {WEEKDAY_LABELS.map((label, day) => (
                    <Checkbox key={day} value={day}>
                      {label}
                    </Checkbox>
                  ))}
                </Space>
              </Checkbox.Group>
            </Form.Item>
          )}
          {editingPlan?.type === 'countdown' && (
            <Form.Item
              name="targetDate"
              label="目标日期"
              rules={[{ required: true, message: '请选择目标日期' }]}
            >
              <DatePicker />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
