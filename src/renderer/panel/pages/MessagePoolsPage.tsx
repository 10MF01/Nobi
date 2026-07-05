import { useEffect, useState } from 'react'
import {
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Popconfirm,
  Space,
  Switch,
  Tabs,
  Typography
} from 'antd'
import type { MessageCategory, MessagePoolEntry } from '../../../../shared/types'

const { Text } = Typography
const { TextArea } = Input

const CATEGORY_LABELS: Record<MessageCategory, string> = {
  encourage: '鼓励',
  comfort: '治愈',
  stern: '批评',
  celebrate: '庆祝',
  neutral: '中性'
}

const CATEGORY_ORDER: MessageCategory[] = ['encourage', 'comfort', 'stern', 'celebrate', 'neutral']

interface AddFormValues {
  text: string
}

export function MessagePoolsPage(): React.JSX.Element {
  const [messages, setMessages] = useState<MessagePoolEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<MessageCategory>('encourage')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingText, setEditingText] = useState('')

  const [addForm] = Form.useForm<AddFormValues>()

  useEffect(() => {
    let ignore = false
    window.api.messages.list().then((list) => {
      if (ignore) return
      setMessages(list)
      setLoading(false)
    })
    return () => {
      ignore = true
    }
  }, [])

  async function reload(): Promise<void> {
    setMessages(await window.api.messages.list())
  }

  async function handleCreate(values: AddFormValues): Promise<void> {
    await window.api.messages.create({ category: activeCategory, text: values.text.trim() })
    addForm.resetFields()
    await reload()
  }

  async function handleToggleActive(entry: MessagePoolEntry): Promise<void> {
    await window.api.messages.setActive(entry.id, !entry.isActive)
    await reload()
  }

  async function handleDelete(id: number): Promise<void> {
    await window.api.messages.delete(id)
    await reload()
  }

  function startEdit(entry: MessagePoolEntry): void {
    setEditingId(entry.id)
    setEditingText(entry.text)
  }

  async function saveEdit(id: number): Promise<void> {
    const text = editingText.trim()
    if (text) {
      await window.api.messages.update(id, { text })
    }
    setEditingId(null)
    await reload()
  }

  if (loading) return <Text type="secondary">加载中...</Text>

  return (
    <Tabs
      activeKey={activeCategory}
      onChange={(key) => setActiveCategory(key as MessageCategory)}
      items={CATEGORY_ORDER.map((category) => {
        const group = messages.filter((m) => m.category === category)
        return {
          key: category,
          label: `${CATEGORY_LABELS[category]} (${group.length})`,
          children: (
            <div>
              <Card size="small" style={{ marginBottom: 16 }}>
                <Form<AddFormValues> form={addForm} layout="inline" onFinish={handleCreate}>
                  <Form.Item
                    name="text"
                    rules={[{ required: true, message: '请输入文案内容' }]}
                    style={{ flex: 1, marginRight: 12 }}
                  >
                    <Input placeholder={`新增一条「${CATEGORY_LABELS[category]}」文案`} />
                  </Form.Item>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button type="primary" htmlType="submit">
                      添加
                    </Button>
                  </Form.Item>
                </Form>
              </Card>

              {group.length === 0 ? (
                <Empty description="暂无文案" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                <List
                  dataSource={group}
                  renderItem={(entry) => (
                    <List.Item
                      actions={[
                        editingId === entry.id ? (
                          <Button
                            key="save"
                            type="link"
                            size="small"
                            onClick={() => saveEdit(entry.id)}
                          >
                            保存
                          </Button>
                        ) : (
                          <Button
                            key="edit"
                            type="text"
                            size="small"
                            onClick={() => startEdit(entry)}
                          >
                            编辑
                          </Button>
                        ),
                        <Popconfirm
                          key="delete"
                          title="确定删除这条文案吗？"
                          okText="删除"
                          okButtonProps={{ danger: true }}
                          cancelText="取消"
                          onConfirm={() => handleDelete(entry.id)}
                        >
                          <Button type="text" size="small" danger>
                            删除
                          </Button>
                        </Popconfirm>
                      ]}
                    >
                      <Space align="start" style={{ width: '100%' }}>
                        <Switch
                          size="small"
                          checked={entry.isActive}
                          onChange={() => handleToggleActive(entry)}
                        />
                        {editingId === entry.id ? (
                          <TextArea
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            autoSize
                            style={{ width: 420 }}
                          />
                        ) : (
                          <Text type={entry.isActive ? undefined : 'secondary'}>{entry.text}</Text>
                        )}
                      </Space>
                    </List.Item>
                  )}
                />
              )}
            </div>
          )
        }
      })}
    />
  )
}
