# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 产品背景

**Nobi** 是一款桌面学习监督宠物应用，桌面角色叫 **のびちゃん**（取自日语「伸びる」，意为持续成长）。

产品所有者是一名在日本工作的上班族，过去因自制力不足未能在留学/工作中保持良好状态，现在希望重新开始：认真执行每日学习计划、考取证书、提升年薪、最终拿到日本永住权。做这款应用是为了帮助自己保持自律 —— のびちゃん 常驻桌面，监督每日/每周计划、长期目标（考证倒计时等）、临时待办的完成情况，并通过动态表情动画 + 可自定义的鼓励/治愈/批评文案给用户情感反馈。

产品所有者情报学出身但动手编程能力较弱，依赖 Claude Code 做重手实现；技术选型由 Claude 提方案、用户拍板决定。**与用户沟通时请使用中文**（用户日语和英语阅读会吃力）。

完整的原始设计方案（含技术选型对比、数据模型、里程碑）见 `C:\Users\maxia\.claude\plans\1-2-logical-emerson.md`（如果该路径在当前环境下不可访问，说明这是历史记录，请以本文件和实际代码为准）。

## 已锁定的产品/技术决策

- 技术栈：**Electron + React + TypeScript**（`electron-vite` 脚手架）
- 形象动画：**精灵图/帧动画**起步（非 Live2D；未来可能升级，但当前不要引入 Live2D 相关依赖）
- 文案生成：**纯预设模板**，规则驱动选择（非 LLM 动态生成）—— 但 `reactionEngine` 要保持接口隔离，方便未来替换成调用 Claude API 的动态生成版本
- 平台：**Windows + Mac 双平台**，从架构上就要考虑两个平台的差异（透明窗口、托盘、通知等）
- 计划类型：每日/每周固定任务、长期目标/倒计时、临时/单次待办，三种都要支持
- 互动时机：固定时间点主动提醒 + 用户随时手动打卡两种都要
- 不引入账号系统/云同步/后端服务，纯本地单用户使用
- 不引入 UI 组件库（如 MUI/Ant Design），面板用纯 React + 基础 CSS，降低维护成本

## 常用命令

```bash
npm install              # 安装依赖（postinstall 会自动跑 electron-builder install-app-deps 做原生模块重建）
npm run dev               # 启动开发模式（electron-vite dev，带 HMR）
npm run typecheck         # 等价于 typecheck:node + typecheck:web
npm run lint               # eslint --cache .
npm run format              # prettier --write .
npm run build              # typecheck + electron-vite build（产出到 out/）
npm run build:win          # 打包 Windows 安装包（nsis）
npm run build:mac           # 打包 macOS（dmg）
```

## 开发环境注意事项（重要，避免重复踩坑）

1. **Node 版本要求 20+**：本机原来是 Node v18.16.0（已 EOL），新版 `electron-builder`/Vite 工具链跑不起来（`npm install` 的 postinstall 会因 ESM/require 冲突报错）。已通过 **nvm-windows**（安装在 `C:\Users\maxia\AppData\Local\nvm`，符号链接在 `C:\nvm4w\nodejs`）装了 **Node 22 LTS** 并切换生效。由于本项目终端的 PATH 环境变量是在会话启动时快照的，新开的 Bash 调用可能看不到已生效的 PATH 更新，跑 node/npm 相关命令前建议显式：
   ```bash
   export PATH="/c/nvm4w/nodejs:$PATH"
   ```
2. **`ELECTRON_RUN_AS_NODE=1` 环境变量陷阱**：当前开发环境的 shell 里全局设置了这个变量（可能是宿主工具链自带的），它会导致任何 Electron 二进制被当作纯 Node 运行，表现为启动 `npm run dev` 时main进程报错 `Cannot read properties of undefined (reading 'isPackaged')`。跑 Electron 相关命令前需要先 `unset ELECTRON_RUN_AS_NODE`。
3. 验证桌面宠物窗口效果时，不能用 headless/无显示器方式跑（无法渲染透明悬浮窗），需要在真实 Windows/Mac 桌面上跑 `npm run dev` 并肉眼/截图验证。

## 架构总览

### 双窗口设计（而非单窗口+路由）

应用有两个完全独立的 `BrowserWindow`，各自有独立的 renderer 入口，通过 `electron.vite.config.ts` 的 `renderer.build.rollupOptions.input` 配置成多页面构建：

- **宠物悬浮窗**（`src/main/windows/petWindow.ts` 创建）：透明、无边框、置顶、不出现在任务栏，渲染入口在 `src/renderer/pet/`。拖拽是手动实现的（渲染层监听 mousedown/mousemove/mouseup，用位移阈值区分"点击"和"拖拽"，通过 IPC 把偏移量发给主进程调用 `win.setPosition`），没有用 OS 原生的 `-webkit-app-region: drag`，因为要同时支持"单击触发反应""双击打开面板"这两种手势。
- **设置面板窗口**（`src/main/windows/panelWindow.ts` 创建）：普通窗口，单例模式（已存在就 `show()+focus()`，不重复创建），渲染入口在 `src/renderer/panel/`。从系统托盘菜单或双击宠物打开。

两个 renderer 入口各自的 `index.html` + `main.tsx` + `App.tsx` 直接放在 `src/renderer/pet/` 和 `src/renderer/panel/` 下（没有再嵌套 `src/` 子目录），面板未来的多页面（计划管理/文案库/历史记录）会在 `src/renderer/panel/pages/` 下继续加。

### IPC 与类型共享

- `shared/ipcChannels.ts` 是 IPC 频道名的唯一来源，同时被 `src/preload/index.ts`（发送方）和 `src/main/ipc/handlers.ts`（接收方）引用，避免字符串硬编码导致的拼写问题。
- `src/preload/index.ts` 通过 `contextBridge.exposeInMainWorld('api', ...)` 暴露的 API 类型（`export type Api = typeof api`）被 `src/preload/index.d.ts` 引用，给 `window.api` 提供完整类型提示，渲染层直接 `window.api.pet.dragStart()` 这样调用，不需要到处 `ipcRenderer.send` 硬编码字符串。
- `shared/` 目录下的文件不能有 Electron/Node 专属依赖，因为它同时会被 `tsconfig.node.json`（main+preload）和 `tsconfig.web.json`（renderer）包含编译。

### 主进程模块划分

- `src/main/windows/` — 窗口工厂函数（每种窗口一个文件）
- `src/main/ipc/handlers.ts` — 所有 `ipcMain.on/handle` 的注册点
- `src/main/tray.ts` — 系统托盘图标与右键菜单
- `src/main/store/`（M3 起）— `better-sqlite3` 连接与 repositories，关系型查询（今日完成率、连续打卡天数）天然适合 SQL 而不是手写 JSON 过滤
- `src/main/engine/`（M4 起）— `reactionEngine.ts` 规则引擎，接口是 `ReactionEngine { react(ctx: ReactionContext): ReactionResult }`，刻意保持零 Electron 依赖、可单测、可在未来替换成调用 Claude API 的动态生成版本而不改调用方
- `src/main/scheduler/`（M5 起）— `node-schedule` 定时任务（中午提醒/晚间提醒/日终总结）

### 动画系统约定（M2 起生效）

`resources/sprites/<emotion-state>/` 每个情绪状态一个文件夹，内含 `manifest.json`（帧宽高/帧数/fps/循环模式）+ 顺序编号 PNG 帧，不用图集，方便后续手动替换素材。渲染层用 `<canvas>` + `requestAnimationFrame` 播放，"何时切换状态"的决策权始终在主进程（通过 IPC 推送 `pet:reaction` 事件），渲染层只负责播放动画，不自行决策。

## 里程碑与当前进度

1. ✅ **M1**（已完成）— 裸透明悬浮窗 + 托盘：静态占位图（🌱 emoji）、可拖拽、托盘菜单、面板窗口双击可打开。已在真实 Windows 桌面上截图验证拖拽和双击开面板正常工作。
2. ⏳ **M2** — 精灵动画状态机：2-3 个占位状态（idle/happy/stern），面板加临时"测试反应"按钮手动触发验证。
3. ⏳ **M3** — 计划/打卡数据模型：`better-sqlite3` 接入，`PlansPage` 完整增删改。
4. ⏳ **M4** — 文案库 + 规则引擎接入打卡：`MessagePoolsPage` + 种子文案，真正的完成率/连续天数计算，打卡真正触发のびちゃん反应。
5. ⏳ **M5** — 主动提醒/通知：`node-schedule` 定时任务、原生通知、设置里可调提醒时间。
6. ⏳ **M6** — `HistoryPage`、UI 打磨、`electron-builder` 双平台打包测试。

每个里程碑都应该能独立用 `npm run dev` 跑起来验证，不要攒成一次性大版本再测试。
