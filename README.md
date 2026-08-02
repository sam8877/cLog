# 静思录 · Jingsilu

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
> **首次登录密码**：默认 `admin123`。生产部署建议通过 `ADMIN_PASSWORD` secret 注入其他密码（如 `wrangler secret put ADMIN_PASSWORD`，须在首次请求前设置）。
> 登录后系统会引导你在「设置 → 账户安全」中修改密码（`password_initial` 标记）。

## ☁️ 部署

### 1. 创建 D1 数据库

```bash
npx wrangler d1 create jingsilu-db
# 将返回的 database_id 填入 wrangler.toml
npx wrangler d1 execute jingsilu-db --remote --file=src/database/schema.sql
```

### 2. 创建 R2 桶

```bash
npx wrangler r2 bucket create jingsilu-media
```

### 3. 部署

```bash
npm run deploy
```

### 4. 设置站点信息（可选）

登录后台 → 「设置」→ 偏好设置，配置博客标题、副标题、每页文章数。

如需 RSS 中的绝对链接，写入站点根 URL：

```bash
npx wrangler d1 execute jingsilu-db --remote --command "INSERT OR REPLACE INTO settings (key, value) VALUES ('site_url', 'https://你的域名')"
```

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
