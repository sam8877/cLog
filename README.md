# cLog · Jingsilu

一个基于 **Cloudflare Workers + D1 + R2** 的单用户博客系统。Markdown 写作、暗色主题、评论审核、RSS 订阅、图片上传——没有第三方追踪脚本，没有 Cookie 弹窗。

> 写作 · 思考 · 记录

## ✨ 特性

- **Markdown 写作** — 管理后台实时预览、字数统计、工具栏快速插入，highlight.js 语法高亮
- **评论系统** — 自建 + 人工审核，管理员自动通过；后台一键批准/标记垃圾/回复
- **RSS 订阅** — `/rss.xml` 全文输出，支持 `content:encoded`
- **媒体库** — R2 存储 + D1 元数据，图片一键复制 Markdown 引用
- **暗色主题** — Vercel 风格设计系统，`prefers-color-scheme` 自动适配，localStorage 记忆
- **移动端适配** — 响应式布局 + 侧边栏抽屉导航
- **安全默认** — CSP/安全响应头、登录与评论限流、默认密码引导改密、JWT 会话（弱密钥自动轮换）

## 🧱 技术栈

| 层 | 技术 |
|---|---|
| 运行时 | [Cloudflare Workers](https://workers.cloudflare.com/) |
| 框架 | [Hono](https://hono.dev/) |
| 数据库 | [D1](https://developers.cloudflare.com/d1/) (SQLite) |
| 对象存储 | [R2](https://developers.cloudflare.com/r2/) |
| Markdown | [marked](https://marked.js.org/) + [highlight.js](https://highlightjs.org/) |

## 🚀 快速开始

前置要求：Node.js ≥ 18、[wrangler](https://developers.cloudflare.com/workers/wrangler/) 已登录（`npx wrangler login`）。

```bash
cd code
npm install
npm run dev          # 启动本地开发服务器 http://localhost:8787
```

首次启动会自动初始化数据库（建表 + **基础数据**：站点设置 + 5 个默认分类）。

> **快速开始（`npm run dev`）**：内置 `--var DEMO_SEED:1`，会额外填充**演示数据**（6 篇文章/14 标签/2 页面/2 评论），供本地体验与测试套件使用——测试依赖这些数据，请勿在开发库删除。
>
> **生产部署**：不设置 `DEMO_SEED`，只初始化基础数据，文章/页面/标签/评论均为空，由你自行创建。
>
> **首次登录密码**：固定为 `admin123`（不支持环境变量注入）。
> **必须修改密码后才能使用后台**——初始密码状态下登录仅获得受限权限，会强制弹出修改密码界面，改密后重新登录即可正常使用。

## 🤖 一键安装（AI 助手提示词）

将下面这段提示词复制给 AI 编程助手（如 Claude Code），即可自动完成云端部署。手动步骤见下一节「部署」。

````markdown
你是一名 Cloudflare 部署专家。请为「cLog」博客系统（Cloudflare Workers + D1 + R2）完成一键部署。

## 部署前检查
1. 克隆仓库（如尚未克隆）：`git clone https://github.com/sam8877/cLog.git`，然后 `cd cLog` 进入项目，代码位于 code/ 目录
2. 确认 Node.js ≥ 18 与 npm 可用
3. 运行 `npx wrangler whoami` 确认已登录 Cloudflare（未登录则提示用户执行 `npx wrangler login`）

## 部署步骤
1. 安装依赖：`npm install`（在 code/ 目录）
2. 创建 D1 数据库：`npx wrangler d1 create jingsilu-db`
   — 从输出提取 `database_id`，更新 `wrangler.toml` 中 [[d1_databases]] 的 database_id
3. 创建 R2 存储桶：`npx wrangler r2 bucket create jingsilu-media`（已存在则跳过）
4. 部署：`npm run deploy`
5. 输出部署后的 URL（形如 https://xxx.workers.dev）

## 部署后验证
1. 访问部署 URL，确认首页 200 且无演示内容（生产为基础模式：仅设置 + 5 个分类）
2. 用 admin123 登录 → 确认弹出强制修改密码界面，改密后重新登录可正常使用后台
3. 验证媒体上传链路：登录后 POST /api/media 上传一张图片 → GET /media/:id 返回 200 → 删除该媒体
4. 确认安全：GET /api/settings 返回中**不含** password_hash / jwt_secret

## 注意事项
- 生产环境**不要**设置 DEMO_SEED（演示数据仅供本地开发/测试）
- jwt_secret 自动随机生成；若数据库来自旧版本（含公开弱密钥），首次初始化会自动轮换
- wrangler.toml 的 R2 binding 名必须为 `MEDIA`（与代码一致），D1 binding 名为 `DB`
- 若部署失败，优先检查 wrangler.toml 的 database_id 与 binding 名、以及 `npx wrangler whoami` 登录态
````

### 更新已有部署

将下面这段提示词复制给 AI 助手，即可将已部署的博客更新到最新代码：

````markdown
你是一名 Cloudflare 部署专家。请为「cLog」博客系统（已部署）完成版本更新。
项目位于本仓库的 code/ 目录。

## 更新步骤
1. 拉取最新代码：`git pull`（在仓库根目录）
2. 安装依赖：`npm install`（在 code/ 目录）
3. 部署：`npm run deploy`
4. 输出更新后的 URL

## 更新后验证
1. 访问部署 URL，确认首页 200
2. 确认原有数据保留（文章/评论/设置不受影响——表结构自动补全、种子数据幂等不覆盖）
3. 登录后台确认正常，抽查新版本功能（视更新内容而定，如版本管理、媒体上传等）
4. 若更新涉及敏感修复（如弱密钥轮换），旧登录会话会失效，需重新登录

## 注意事项
- **不要**重新创建 D1 数据库或 R2 桶（保留 wrangler.toml 中已有的 database_id 与 bucket 配置）
- **不要**设置 DEMO_SEED（生产保持基础模式）
- wrangler.toml 若被覆盖，确认 database_id 与 binding 名（DB / MEDIA）正确
- 数据库来自旧版本且含公开弱密钥时，首次初始化会自动轮换 jwt_secret
````

> 部署完成后登录后台（`/admin`）→ 「设置」→ 偏好设置，可配置博客标题、副标题、每页文章数、站点 URL（RSS 绝对链接）与关于博主介绍。无需任何命令行操作。

## 🧪 测试

```bash
npm run test:api           # API 集成测试 (97 项, 需 dev server 运行)
npm run test:e2e           # UI 自动化测试 (52 项, 自动复用 dev server)
npm run test:ui            # UI 测试交互界面
```

CI（GitHub Actions）会在每次推送时自动执行全部测试。

## 📁 项目结构

```
code/
├── src/
│   ├── index.ts           # 入口: 路由 + 安全头 + 中间件
│   ├── api/auth.ts        # 认证: 密码/JWT/限流/改密
│   ├── services/          # D1 数据层、Markdown 渲染
│   ├── templates/         # 服务端渲染模板 (首页/文章/归档/搜索/后台 SPA/RSS)
│   ├── database/          # schema.sql (表结构参考; 运行时 ensureSchema 自动建表)
│   └── seed.ts            # 首次初始化: 建表 + 基础数据 + DEMO_SEED 演示数据
├── test/
│   ├── api.test.js        # API 集成测试
│   └── e2e/               # Playwright UI 测试
├── design/                # 设计稿与评审记录 (仓库根目录)
└── wrangler.toml          # Worker 配置 (D1/R2/本地变量)
```

## 🤝 贡献

欢迎提 Issue 和 PR。请阅读 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 📄 License

[MIT](LICENSE)
