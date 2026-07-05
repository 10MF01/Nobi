# Nobi（のびちゃん）

一款桌面学习监督宠物应用。桌面角色 **のびちゃん**（取自日语「伸びる」，意为持续成长）常驻桌面，监督每日/每周计划、长期目标（考证倒计时等）、临时待办的完成情况，并通过动态表情动画 + 可自定义的鼓励/治愈/批评文案给用户情感反馈。

个人使用工具，纯本地单用户，不含账号系统/云同步/后端服务。

## 技术栈

- Electron + React + TypeScript（`electron-vite` 脚手架）
- `framer-motion` 驱动的手绘 SVG 角色动画
- `better-sqlite3` 本地数据存储
- Ant Design（面板 UI）
- `node-schedule`（定时提醒）

## 开发

```bash
npm install              # 安装依赖
npm run dev              # 启动开发模式（带 HMR）
npm run typecheck        # 类型检查
npm run lint             # eslint
npm run build:win        # 打包 Windows 安装包
npm run build:mac        # 打包 macOS
```

详细架构说明见 [`CLAUDE.md`](./CLAUDE.md)。

## 进度

- [x] M1 透明悬浮窗 + 托盘
- [x] M2 情绪状态机（idle/happy/comfort/stern）
- [x] M3 计划/打卡数据模型
- [x] M4 文案库 + 规则引擎接入打卡
- [x] M5 主动提醒/通知
- [ ] M6 历史记录页 + UI 打磨 + 双平台打包
