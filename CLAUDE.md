# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 产品背景

**Nobi** 是一款桌面学习监督宠物应用，桌面角色叫 **のびちゃん**（取自日语「伸びる」，意为持续成长）。

产品所有者是一名在日本工作的上班族，过去因自制力不足未能在留学/工作中保持良好状态，现在希望重新开始：认真执行每日学习计划、考取证书、提升年薪、最终拿到日本永住权。做这款应用是为了帮助自己保持自律 —— のびちゃん 常驻桌面，监督每日/每周计划、长期目标（考证倒计时等）、临时待办的完成情况，并通过动态表情动画 + 可自定义的鼓励/治愈/批评文案给用户情感反馈。

产品所有者情报学出身但动手编程能力较弱，依赖 Claude Code 做重手实现；技术选型由 Claude 提方案、用户拍板决定。**与用户沟通时请使用中文**（用户日语和英语阅读会吃力）。

完整的原始设计方案（含技术选型对比、数据模型、里程碑）见 `C:\Users\maxia\.claude\plans\1-2-logical-emerson.md`（如果该路径在当前环境下不可访问，说明这是历史记录，请以本文件和实际代码为准）。

## 已锁定的产品/技术决策

- 技术栈：**Electron + React + TypeScript**（`electron-vite` 脚手架）
- 形象动画：**`framer-motion` 驱动的手绘 SVG 角色**（`src/renderer/pet/PetCharacter.tsx`），不是 PNG 精灵图/帧动画，也不是 Live2D。这是 M2 阶段对最初"精灵图起步"方案的修正 —— 用户看了占位图后反馈"不够可爱"，明确表示**为了界面效果可以引入动画库/组件库，即使增加维护成本也没关系**。以后再调整角色外观/表情，直接改这个文件里的 SVG 形状和 `framer-motion` 的 variants，不需要准备美术资源文件。
- 文案生成：**纯预设模板**，规则驱动选择（非 LLM 动态生成）—— 但 `reactionEngine` 要保持接口隔离，方便未来替换成调用 Claude API 的动态生成版本
- 平台：**Windows + Mac 双平台**，从架构上就要考虑两个平台的差异（透明窗口、托盘、通知等）
- 计划类型：每日/每周固定任务、长期目标/倒计时、临时/单次待办，三种都要支持
- 互动时机：固定时间点主动提醒 + 用户随时手动打卡两种都要
- 不引入账号系统/云同步/后端服务，纯本地单用户使用
- 面板 UI 组件库：**Ant Design（v6）**。这是 M3 完成后对最初"纯 React + 基础 CSS，不引入组件库"方案的修正——用户看了手写 CSS 的面板后明确表示不满意界面风格，要求接入成熟组件库；在 MUI 和 Ant Design 之间选了 **Ant Design**，原因是中文文档/社区讨论对用户自己后续查资料更友好。这与 [M2 的角色动画决策] 是同一类"为界面效果可以引入库，维护成本不是第一优先级"的取舍。

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
- `src/main/store/`（M3 起）— `db.ts` 是 `better-sqlite3` 单例连接（懒加载，数据库文件在 `app.getPath('userData')/nobi.db`），启动时 `CREATE TABLE IF NOT EXISTS` 建表，没有做正式迁移框架；`repositories/planRepo.ts`、`repositories/checkinRepo.ts` 封装 SQL，对外只暴露 `shared/types.ts` 里的驼峰字段类型（repo 内部负责 snake_case 列名 ↔ 驼峰字段的转换）
- `src/main/engine/`（M4 起）— `reactionEngine.ts`/`streakCalculator.ts` 是纯函数，零 Electron/DB 依赖、可单测、未来可替换成调用 Claude API 的动态生成版本；`reactionCoordinator.ts` 负责把 repo 查询结果组装成两者需要的输入，并把结果通过 `petWindow.webContents.send` 推给宠物窗口，是主进程里唯一同时接触"纯引擎"和"Electron/DB"的胶水层
- `src/main/scheduler/`（M5 起）— `reminderScheduler.ts`，`node-schedule` 定时任务（中午提醒/晚间提醒/日终总结），`rescheduleReminders(petWindow)` 在 app 启动时和每次面板保存提醒设置后都会被调用，先 cancel 所有旧 job 再按最新设置重建，避免重复注册

### 动画系统约定（M2 起生效，framer-motion 方案）

- `shared/types.ts` 定义 `EmotionState = 'idle' | 'happy' | 'comfort' | 'stern'` 和 `PetReactionPayload { emotion, durationMs }`，是情绪状态的唯一权威定义。
- `src/renderer/pet/PetCharacter.tsx` 是纯展示组件：接收 `emotion` prop，用 `framer-motion` 的 `variants` 控制整体身体动作（呼吸/跳动/摇摆/抖动），内部 `Eyes`/`Mouth` 子组件按 emotion 分支渲染不同的 SVG 形状（不做路径变形，直接切换整个形状，更简单可靠）。
- **"何时切换状态"的决策权始终在主进程**：主进程通过 `ipcMain`→`petWindow.webContents.send(IPC_CHANNELS.PET_REACTION, payload)` 推送 `{ emotion, durationMs }`，`src/renderer/pet/App.tsx` 收到后 `setEmotion` 并启动一个 `setTimeout(durationMs)` 到期自动回到 `idle`（对应原计划里"播一次后回到 idle"的 loopMode，只是用 setTimeout 实现而不是精灵图 manifest 里的字段）。
- 面板页面（`src/renderer/panel/App.tsx`）有 4 个测试按钮，调用 `window.api.panel.testReaction({ emotion, durationMs })`，主进程收到 `PANEL_TEST_REACTION` 后原样转发给宠物窗口 —— 这是验证每个情绪状态观感的标准方式，以后新增/调整表情也应该先在这里测试。
- 单击宠物（非拖拽）目前会触发一个 1.2s 的 `happy` 反应（"摸它一下它会开心"），这是占位行为；M4 会用 `reactionEngine` 的真实规则替换/扩展这个反应来源。

### 数据模型与计划管理（M3 起生效）

- `shared/types.ts` 定义 `PlanType = 'daily' | 'weekly' | 'countdown' | 'one_off'`、`Plan`、`PlanInput`、`CheckIn`。四种类型共用一张 `plans` 表（而不是每种类型单独建表），类型特有字段（`weekdays`、`targetDate`）对不适用的类型直接置 `null`——因为四种计划共享增删改+列表渲染逻辑的部分远大于差异部分。
- `daily`/`weekly` 计划的"今天完成了没"由 `check_ins` 表判断（`UNIQUE(plan_id, date)`，同一天重复打卡即 toggle 取消），不占用 `plans.is_done`；`countdown`/`one_off` 相反，直接用 `plans.is_done` 表示达成/完成，不走 `check_ins`。两条判断路径不要混用。
- IPC 走 `ipcMain.handle`/`ipcRenderer.invoke`（区别于 M1/M2 的 `on`/`send`），因为增删改查都需要返回值；`window.api.plans.*` 和 `window.api.checkIns.*` 是对应的 preload 封装。
- `src/renderer/panel/pages/PlansPage.tsx` 是当前面板的主页签（`App.tsx` 里做了一个极简的 tab 切换，"计划管理"/"测试反应"），四种类型固定分区展示，新建表单按所选类型动态显示星期多选或目标日期选择器；编辑走的是 `Modal + Form`弹窗（点"编辑"打开，`Form.setFieldsValue` 预填），不是行内编辑；删除包了一层 `Popconfirm` 二次确认。
- **`better-sqlite3` 是原生模块，每次单独 `npm install` 新增/更新依赖后，如果 `npm run dev` 里报 `NODE_MODULE_VERSION` 不匹配（ERR_DLOPEN_FAILED），要手动跑一次 `npx electron-builder install-app-deps` 重新为 Electron 的 Node ABI 编译，然后完全杀掉旧的 electron 进程再 `npm run dev`（单纯 HMR 不会重新加载原生模块）。** postinstall 钩子理论上会自动做这件事，但实测在同一次 `npm install <pkg>` 里未必生效，遇到该报错时优先假设是这个原因。

### 文案库与规则引擎（M4 起生效）

- `shared/types.ts` 新增 `MessageCategory = 'encourage' | 'comfort' | 'stern' | 'celebrate' | 'neutral'`（前四种对应 `reactionEngine` 的规则输出，`neutral` 预留给 M5 的主动提醒等非完成率触发场景，目前只在文案库 CRUD 里可见）、`MessagePoolEntry`/`MessagePoolInput`，以及 `ReactionContext`/`ReactionResult`/`ReactionEngine` 接口。`message_pools` 表结构和 `plans`/`check_ins` 一样走 `CREATE TABLE IF NOT EXISTS`，首次启动通过 `src/main/store/seedMessages.ts`（35 条种子文案，5 类各 7 条）自动导入，判断依据是表为空（`seedMessagePoolsIfEmpty`），不是正式迁移框架。
- `src/main/engine/reactionEngine.ts` 是纯函数模块（零 Electron/DB 依赖，符合最初设计的"可单测、未来可替换成调用 Claude API"的要求）：`decideCategory` 按"完成率 + 连续天数 + 是否刚断连续记录"决定 `MessageCategory`，再从 `ctx.pool`（调用方传入的已启用文案）里按 `lastUsedAt` 最早的 3 条中随机挑一条，避免文案频繁重复也避免死板轮询。`trigger: 'goal_done'`（完成 countdown/one_off）会直接短路到 `celebrate`，不看完成率。
- `src/main/engine/streakCalculator.ts` 也是纯函数（`computeDailyStats`），但通过参数注入的方式接收"某天打卡了哪些计划 id""某天是星期几""日期偏移"这些回调，而不是直接 import dayjs 之外的任何 Electron/DB 代码——真正的数据组装和 dayjs 日期运算放在下面的 coordinator 里。连续天数的口径：从目标日期往前数，每天"完成率是否 ≥ 0.8"，不适用的类型（当天没有 applicable 的 daily/weekly 计划）跳过、不计入也不打断连续。
- `src/main/engine/reactionCoordinator.ts` 是唯一同时依赖 Electron（`BrowserWindow`）+ repo 层 + 上面两个纯引擎的地方：`triggerCheckinReaction(petWindow, date)` 在打卡（非取消打卡）后被调用，一次性拉出最近 60 天的 check_ins 组装成 `Map<date, Set<planId>>` 避免逐天查询，算出今天和昨天的 `DailyStats`（`justBrokeStreak = 昨天有连续记录 && 今天完成率 < 0.4`），再调用 `reactionEngine.react`；`triggerGoalDoneReaction(petWindow)` 给 countdown/one_off 的"标记完成"用，直接走 `celebrate` 分支。选中的文案会调用 `messagePoolRepo.markMessageUsed` 更新 `lastUsedAt`。
- IPC 层：`CHECKINS_TOGGLE`/`PLANS_SET_DONE` 的 handler 在写库成功后，仅当"变成已完成"（不是取消勾选）时才调用对应的 coordinator 函数——取消打卡/取消完成不触发反应。`PetReactionPayload` 新增了可选的 `message?: string` 字段，宠物渲染进程收到后连同 `emotion`/`durationMs` 一起消费。
- 宠物窗口从 220×220 放大到 260×300（`src/main/windows/petWindow.ts`），角色本体改成贴底部对齐（`alignItems: 'flex-end'`）而不是居中，这样情绪反应的气泡文案（`src/renderer/pet/MessageBubble.tsx`，`framer-motion` 的 `AnimatePresence` 做淡入淡出）能在角色上方展开而不被窗口边界裁切；窗口锚点算法不变（右下角 margin 不变），只是往上"长高"。
- 面板新增"文案库"标签页（`src/renderer/panel/pages/MessagePoolsPage.tsx`），用 `Tabs` 按 `MessageCategory` 分组，每组一个 `Switch` 控制启用/停用 + 行内编辑（点"编辑"切成 `TextArea`，点"保存"提交）+ `Popconfirm` 删除，风格和 `PlansPage` 保持一致。
- 已在真实 Windows 桌面验证：勾选每日计划打卡后，のびちゃん 正确切换到 happy 情绪并弹出从种子文案库里选中的一条鼓励语气泡（气泡随情绪动画一起在 `durationMs` 后消失）；文案库页面能看到 5 个分类各 7 条种子文案，开关/编辑/删除入口渲染正常。

### 主动提醒与日终总结（M5 起生效）

- `shared/types.ts` 新增 `ReminderSettings { noonEnabled, noonTime, eveningEnabled, eveningTime, summaryEnabled, summaryTime }`（`*Time` 是 `HH:mm` 字符串）和 `DailySummary { date, completionRate, streak, createdAt }`。
- 提醒时间/开关这类轻量设置**没有用原始方案里提到的 `electron-store`**，而是复用已经跑通的 `better-sqlite3`，新增一张通用 `settings` 表（`key TEXT PRIMARY KEY, value TEXT`，value 存 JSON），`src/main/store/repositories/settingsRepo.ts` 的 `getReminderSettings`/`setReminderSettings` 读写 `key = 'reminderSettings'` 这一行，读不到时回退到代码里的默认值（中午 12:30/晚间 21:00/日终 23:30，均默认开启）。这是为了少引入一个依赖／避免重蹈 `better-sqlite3` 当初 ABI 版本踩坑的覆辙，不是长期设计上的强约束，如果以后 `settings` 表并不好用可以再换。
- 新增 `daily_summaries` 表（`date` 主键，`completion_rate`/`streak`/`created_at`），`repositories/dailySummaryRepo.ts` 的 `upsertDailySummary` 每天写一行快照，是给 M6 `HistoryPage` 用的历史数据来源，M5 本身不读它。
- `reactionEngine.ts` 里原本内部私有的选文案逻辑改名导出成 `pickMessageForCategory(pool, category)`，因为提醒场景（中午/晚间 nudge）的 `MessageCategory` 是外部直接指定的 `'neutral'`，不需要走 `decideCategory` 那套"看完成率"的决策分支——`reactionEngine.react()` 内部仍然调用同一个函数，只是提醒场景绕过了 `react()` 直接调它。
- `reactionCoordinator.ts` 新增两个函数：`triggerNudgeReaction(petWindow, date)` 只有在"今天存在还没打卡的 daily/weekly 计划"时才会弹一次 `idle` 情绪的气泡 + 系统通知（`neutral` 分类文案），全部打卡完就安静不打扰；`triggerDailySummary(petWindow, date)` 复用打卡反应同一套完成率/连续天数计算（提取成了 `buildTodayContext` 共享函数），额外写入 `daily_summaries` 快照并发一条"今天完成率 xx%，连续 N 天"的系统通知。系统通知统一走 `sendNotification(title, body)` helper（`Notification.isSupported()` 判断 + 复用托盘那个 `resources/icon.png` 做图标），Windows 下能正确显示 Nobi 图标和应用名是因为 `main/index.ts` 里已经调用过 `electronApp.setAppUserModelId('com.nobi.app')`。
- IPC 新增 `REMINDERS_GET_SETTINGS`/`REMINDERS_SET_SETTINGS`（`handle`，因为要返回值）和 `REMINDERS_TEST_NUDGE`/`REMINDERS_TEST_SUMMARY`（`on`，纯触发不需要返回值）；保存设置的 handler 里 `setReminderSettings` 之后立刻调用 `rescheduleReminders(petWindow)`，让改动马上生效，不需要重启 app。
- 面板新增"提醒设置"标签页（`src/renderer/panel/pages/ReminderSettingsPage.tsx`）：三行 `Switch + TimePicker`（`format='HH:mm'`，和 `PlansPage` 的 `DatePicker` 一样，`Dayjs` 只在表单层出现，`.format('HH:mm')` 之后才落到 IPC/DB）+ 保存按钮；下面单独一个"立即测试"区块，两个按钮直接调 `window.api.reminders.testNudge()`/`testSummary()`，不用等到设定的时间点也能验证真实的提醒/总结逻辑——这是刻意加的，因为定时任务本身很难在开发阶段"等出来"验证。
- 已在真实 Windows 桌面验证：面板打开时正确读到默认提醒时间；点"测试：日终总结"后のびちゃん 弹出鼓励语气泡，同时右下角弹出 Windows 原生通知"今日总结 / 今天完成率 100%，连续 1 天达标。"；点"测试：打卡提醒"在当天已全部打卡的情况下正确保持静默（无气泡无通知），符合"不要过度打扰"的设计。

### 面板 UI 组件库约定（Ant Design，M3 后接入）

- `src/renderer/panel/App.tsx` 顶层包一层 `ConfigProvider`，`theme.token` 里定义了品牌主题色：`colorPrimary: '#3f9b54'`（森绿，呼应のびちゃん本身的配色，不是 Ant Design 默认的靛蓝），以及 `colorBgLayout`/`colorBorder`/`fontFamily`（CJK 字体栈 `PingFang SC`/`Microsoft YaHei UI` 优先）。以后调整面板整体配色，改这里的 token 就行，不用满页面找内联样式。同时传了 `locale={zhCN}`（`antd/locale/zh_CN`），保证 `DatePicker`/`Popconfirm` 等内置文案是中文。
- 日期统一用 `dayjs`（Ant Design v6 默认日期库），`PlansPage.tsx` 里 `DatePicker` 的值和 `Plan.targetDate`（`YYYY-MM-DD` 字符串）之间要手动 `dayjs(str)` / `.format('YYYY-MM-DD')` 转换，数据库和 IPC 层只认字符串，不认 `Dayjs` 对象。
- 正式决策前先做了一版**纯 HTML/CSS 静态设计预览**（Artifact，手工还原 Ant Design 视觉语言，两套配色对比）给用户确认方向，用户选定森绿配色后才正式动手改 `PlansPage.tsx`/`App.tsx` 的代码——以后再有较大的视觉改版，先出静态预览走一遍确认比直接改代码返工成本低。
- `main.tsx` 里引入了 `antd/dist/reset.css` 做基础样式重置；`antd` 用的是 v6（对 React 19 原生兼容，不需要 `@ant-design/v5-patch-for-react-19` 这个只给 v5 用的兼容包）。

## 里程碑与当前进度

1. ✅ **M1**（已完成）— 裸透明悬浮窗 + 托盘：可拖拽、托盘菜单、面板窗口双击可打开。已在真实 Windows 桌面上截图验证拖拽和双击开面板正常工作。
2. ✅ **M2**（已完成）— 情绪状态机：`framer-motion` 驱动的可爱角色（`PetCharacter.tsx`），idle/happy/comfort/stern 四态，面板测试按钮手动触发，收到反应后自动播放并在 `durationMs` 后回到 idle。已逐个状态截图验证。
3. ✅ **M3**（已完成）— 计划/打卡数据模型：`better-sqlite3` 接入（`src/main/store/`），`PlansPage` 完整支持四种计划类型的增删改查、打卡/完成勾选、行内编辑。已在真实 Windows 桌面上创建四种类型的计划、勾选打卡/完成、编辑标题、删除，并**完全重启应用**验证数据正确持久化（sqlite 文件在 userData 目录，不是内存态）。
4. ✅ **M4**（已完成）— 文案库 + 规则引擎接入打卡：`message_pools` 表 + 35 条种子文案、纯函数 `reactionEngine`/`streakCalculator` + 依赖二者的 `reactionCoordinator`，打卡/完成目标真正触发のびちゃん情绪反应 + 气泡文案。已在真实 Windows 桌面上验证打卡后正确弹出对应情绪与文案，文案库页面 CRUD 正常。
5. ✅ **M5**（已完成）— 主动提醒/通知：`node-schedule` 定时任务（中午/晚间提醒 + 日终总结）、原生通知（`Notification` API）、面板"提醒设置"页可调时间与开关并支持立即测试。已在真实 Windows 桌面上验证日终总结正确弹出情绪反应 + 系统通知，打卡提醒在无需提醒时正确保持静默。
6. ⏳ **M6** — `HistoryPage`、UI 打磨、`electron-builder` 双平台打包测试。

每个里程碑都应该能独立用 `npm run dev` 跑起来验证，不要攒成一次性大版本再测试。

## 版本控制

- 本地已 `git init`，提交身份是**仓库级别**单独设置的 `user.name=MFF` / `user.email=xiaofeima600@gmail.com`（跟这台电脑全局 git 配置的公司邮箱不一样，只在这个仓库生效）。
- **每完成一个里程碑/功能点，都要在验证通过后立刻本地 commit**，方便随时回退 —— 这是用户明确要求的工作习惯，不要攒到最后一起提交。
- 远程仓库暂缓（用户还没决定托管平台），目前只做本地提交；等用户提供远程地址后再配置 `git remote add origin` 并推送。
