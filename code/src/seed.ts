// ─── Seed data loader ─────────────────────────────────────

import type { D1Database } from '@cloudflare/workers-types';
import { sha256 } from './api/auth';

// 运行时确保全部表结构存在 (全新库自动初始化, 老库自动补表, 不受 seeded 标记影响)
// 注意: D1 batch 中语句不能互相依赖, CREATE TABLE 与 CREATE INDEX 分开执行
export async function ensureSchema(db: D1Database): Promise<void> {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS categories (
      slug TEXT PRIMARY KEY, name TEXT NOT NULL,
      description TEXT DEFAULT '', sort_order INTEGER DEFAULT 0
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS tags (
      slug TEXT PRIMARY KEY, name TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS posts (
      slug TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
      excerpt TEXT DEFAULT '', category TEXT REFERENCES categories(slug),
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS post_tags (
      post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
      tag_slug TEXT NOT NULL REFERENCES tags(slug) ON DELETE CASCADE,
      PRIMARY KEY (post_slug, tag_slug)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS pages (
      slug TEXT PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY, post_slug TEXT NOT NULL REFERENCES posts(slug) ON DELETE CASCADE,
      author TEXT NOT NULL, email TEXT DEFAULT '', body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','spam')),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, filename TEXT NOT NULL, key TEXT NOT NULL,
      content_type TEXT NOT NULL, size INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS rate_limits (
      key TEXT PRIMARY KEY, count INTEGER NOT NULL DEFAULT 0, window_start INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS revisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL, entity_slug TEXT NOT NULL,
      title TEXT NOT NULL, content TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '', category TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'draft', note TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL
    )`),
  ]);
  await db.batch([
    db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_post ON comments(post_slug)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_comments_status ON comments(status)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_post_tags_tag ON post_tags(tag_slug)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_start)'),
    db.prepare('CREATE INDEX IF NOT EXISTS idx_revisions_entity ON revisions(entity_type, entity_slug, id DESC)'),
  ]);
}

// 历史上公开过的弱 JWT 密钥 — 检测到即自动轮换 (旧库升级安全修复)
const WEAK_JWT_SECRETS = ['jingsilu-blog-secret-change-me', 'fallback-secret-change-me'];

export async function seedDatabase(db: D1Database, env?: { ADMIN_PASSWORD?: string; DEMO_SEED?: string }): Promise<void> {
  // ─── 安全: 轮换公开/弱 JWT 密钥 (不受 seeded 门限制, 每次实例初始化时检查) ───
  const secretRow = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('jwt_secret').first<{ value: string }>();
  if (!secretRow || WEAK_JWT_SECRETS.includes(secretRow.value)) {
    await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind('jwt_secret', randomSecret()).run();
    console.log('  [安全] 已轮换弱 JWT 密钥');
  }

  // Check if already seeded (基础段只执行一次)
  const existing = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('seeded').first();

  if (!existing) {
    console.log('Seeding database...');

  // ─── Settings (基础) ─────────────────────────────────────
  // 密码: 默认 admin123, 生产可通过 ADMIN_PASSWORD 注入覆盖; 标记引导改密
  const initialPassword = env?.ADMIN_PASSWORD || 'admin123';
  const passwordHash = await sha256(initialPassword);
  await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('password_hash', passwordHash).run();
  await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('blog_title', '静思录').run();
  // 与后台偏好设置的默认值保持一致 (DEFAULTS.tagline = '文字自有重量')
  await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('blog_tagline', '文字自有重量').run();
  // 标记初始密码待修改 (登录后引导改密)
  await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('password_initial', '1').run();

  // 仅默认密码时提示; ADMIN_PASSWORD 注入时绝不打印实际值 (防日志泄露凭据)
  if (!env?.ADMIN_PASSWORD) {
    console.log('  [静思录] 初始密码: admin123 (默认, 请登录后立即修改)');
  }

  // ─── Categories (基础分类骨架) ──────────────────────────
  await db.prepare('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)').bind('tech', '技术', '编程语言、系统架构、前端工程实践', 1).run();
  await db.prepare('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)').bind('design', '设计', '交互设计、视觉系统、用户体验思考', 2).run();
  await db.prepare('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)').bind('writing', '写作', '写作方法、创作心理、文字工艺', 3).run();
  await db.prepare('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)').bind('reading', '阅读', '读书笔记、阅读方法、书单推荐', 4).run();
  await db.prepare('INSERT OR IGNORE INTO categories VALUES (?,?,?,?)').bind('life', '生活', '日常观察、工作方式、远程办公体验', 5).run();

    // Mark as seeded
    await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('seeded', '1').run();
    console.log('Seeding complete!');
  }

  // ─── 演示数据 (在基础段之后, 依赖 categories 已存在; 独立标记 demo_seeded,
  // 基础库可后补演示数据) ────────────────────────────────
  if (env?.DEMO_SEED === '1') {
    const demo = await db.prepare('SELECT value FROM settings WHERE key = ?').bind('demo_seeded').first();
    if (!demo) {
      console.log('  [DEMO_SEED] 初始化演示数据 (文章/标签/页面/评论)...');
      await seedDemoData(db);
      await db.prepare('INSERT OR IGNORE INTO settings VALUES (?, ?)').bind('demo_seeded', '1').run();
    }
  }
}

/** 演示数据: 供本地开发与自动化测试使用 (生产安装不填充) */
async function seedDemoData(db: D1Database): Promise<void> {
  // Tags
  const tags = [
    ['rust', 'Rust'], ['css', 'CSS'], ['typescript', 'TypeScript'], ['javascript', 'JavaScript'],
    ['frontend', '前端'], ['architecture', '架构'], ['async', '异步编程'], ['writing-tag', '写作'],
    ['sys-design', '系统设计'], ['tools', '工具'], ['km', '知识管理'], ['efficiency', '效率'],
    ['creativity', '创造力'], ['design-tag', '设计'],
  ];
  for (const [slug, name] of tags) {
    await db.prepare('INSERT OR IGNORE INTO tags VALUES (?,?)').bind(slug, name).run();
  }

  // Posts
  const posts = [
    {
      slug: 'knowledge-management-system',
      title: '构建一个个人知识管理系统：从笔记到洞见',
      content: `## 问题：为什么大多数笔记系统会失效？

大多数人的笔记流程是这样的：读到一篇好文章 → 剪藏到 Notion → 加几个标签 → 再也没打开过。问题的核心不是"记得不够多"，而是缺少两个关键步骤：**定期回顾**和**主动连接**。

认知科学研究表明，记忆的强度取决于提取次数，而非编码次数。换句话说，*反复回顾一条笔记，比一次性写得很详细更重要*。

## 四步工作流

我经过两年迭代，沉淀出以下四个步骤。它们足够轻量，不需要任何付费软件。

### 1. 捕捉 — 零摩擦收集

任何想法、链接、截图，在 30 秒内丢进收件箱。不分类、不整理、不判断价值。

> "如果你在捕捉阶段就开始分类，你实际上在做两件事——而且两件都做不好。" — Tiago Forte

### 2. 整理 — 每周一次的消化时间

每周日晚上花 30 分钟过一遍收件箱。每一条笔记做三选一：
- **删除**：回头看觉得没价值的，直接删。
- **归档**：有价值但暂时用不上的，放到 reference 文件夹。
- **提炼**：和当前项目相关的，用自己的话重写一遍。

关键动作是第三步——**用自己的话重写**。这是从"收藏"到"理解"的分界线。

### 3. 连接 — 让笔记之间对话

当一条新笔记被提炼后，花两分钟回答三个问题：
1. 这和哪条已有笔记相关？
2. 这和哪条已有笔记矛盾？
3. 这能回答什么问题，或引出什么新问题？

### 4. 输出 — 知识的最小可行产品

每当你积累了 5-10 条相互关联的笔记，就试试把它变成一个输出物：一篇博客文章、一段 Tweet thread、一次团队分享。输出迫使你发现知识盲区，并迫使碎片连接成体系。

---

知识管理不是关于"收集更多"——它是关于**建立自己的思考基础设施**。如果你只能从这篇文章带走一件事：**这周日花 30 分钟，清理你的收件箱，然后选 3 条笔记用自己的话重写。**`,
      excerpt: '笔记工具泛滥的时代，关键在于方法而非工具。本文梳理了一套轻量级知识管理流程，从碎片捕捉到定期回顾，不需要任何付费软件。',
      category: 'tech',
      created_at: '2026-07-20',
      tags: ['km', 'efficiency', 'tools'],
    },
    {
      slug: 'css-container-queries',
      title: 'CSS Container Queries 实战：告别全局断点思维',
      content: `## 为什么需要 Container Queries？

传统的媒体查询基于视口宽度来调整布局。但在组件化的世界里，同一个组件可能出现在主内容区（宽）、侧边栏（窄）或模态框（中等）。媒体查询无法感知组件自身的容器宽度。

Container Queries 解决了这个问题：你可以基于元素自身的容器尺寸来应用样式。

## 基础用法

\`\`\`css
.container {
  container-type: inline-size;
  container-name: card;
}

@container card (min-width: 400px) {
  .card-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
\`\`\`

## 三个实战案例

### 案例 1：自适应卡片组件
产品卡片在宽容器中展示为横向布局，在窄容器中展示为纵向布局。

### 案例 2：响应式导航栏
导航栏根据可用空间自动切换显示模式，无需任何 JavaScript。

### 案例 3：文章排版自适应
文章正文区域根据容器宽度自动调整字号和行高。

## 浏览器兼容性

所有现代浏览器现已支持 Container Queries。可以使用特性检测做渐进增强。`,
      excerpt: 'Container Queries 已经可以在生产环境使用。通过三个真实组件案例，展示如何从全局媒体查询迁移到组件级响应式设计。',
      category: 'tech',
      created_at: '2026-07-15',
      tags: ['css', 'frontend'],
    },
    {
      slug: 'rust-async-runtime',
      title: 'Rust 中的异步运行时：tokio 核心概念拆解',
      content: `## Future：异步编程的基石

在 Rust 中，一个异步函数被编译成一个实现了 Future trait 的状态机：

\`\`\`rust
pub trait Future {
    type Output;
    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output>;
}
\`\`\`

关键在于 poll 方法——它不会阻塞，要么返回 Ready，要么返回 Pending 并注册 waker。

## tokio 的架构层次

1. **运行时核心**：task 调度、worker 线程池
2. **I/O 驱动**：epoll/kqueue/IOCP 的事件循环
3. **实用工具**：channel、互斥锁、信号量

## 选择合适的运行时

- **tokio**：全功能，适合网络服务
- **async-std**：API 更接近标准库
- **smol**：轻量级，适合嵌入场景

对于大多数生产项目，tokio 是最安全的选择。`,
      excerpt: '从 Future trait 到 task 调度，理解 tokio 的设计决策如何影响你写的每一行 async 代码。附可运行的迷你运行时实现。',
      category: 'tech',
      created_at: '2026-07-08',
      tags: ['rust', 'async'],
    },
    {
      slug: 'blog-system-design',
      title: '从零设计一个博客系统：架构决策记录',
      content: `## 动机

在 2026 年重新构建个人博客时，我记录下了每一个关键决策和它的理由。

## 决策 1：SSG vs SSR

**选择：Cloudflare Workers + D1**

理由：我想要评论功能和实时更新的管理后台，而这需要一个小的服务器端组件。

## 决策 2：评论系统

**选择：自建 + 人工审核**

理由：第三方评论系统的追踪脚本让我不安。博客评论量不大，人工审核完全可行。

## 决策 3：数据模型

标签和分类使用了不同的模型：
- **分类**：一篇文章只属于一个分类（层级关系）
- **标签**：一篇文章可以有多个标签（网状关系）

## 决策 4：编辑器

管理后台使用 Markdown 编辑器 + 实时预览。纯文本，可以版本控制，迁移成本为零。

---

每一个技术决策都是对特定上下文和约束的回应。重要的是理解你自己的需求，而不是机械地套用"最佳实践"。`,
      excerpt: '为什么选择 SSG 而不是 SSR？评论系统自建还是接入？标签和分类的数据模型如何设计？记录每一个关键取舍。',
      category: 'tech',
      created_at: '2026-06-28',
      tags: ['architecture', 'sys-design'],
    },
    {
      slug: 'typescript-56',
      title: 'TypeScript 5.6 新特性速览：迭代器辅助方法来了',
      content: `## Iterator 辅助方法

TypeScript 5.6 最令人期待的更新是原生 Iterator 辅助方法的类型支持：

\`\`\`typescript
const result = [1, 2, 3, 4, 5]
  .values()
  .filter(n => n % 2 === 0)
  .map(n => n * 2)
  .take(2)
  .toArray();
// result: [4, 8]
\`\`\`

## 为什么这很重要？

Iterator 辅助方法是惰性求值的——只在最后 toArray() 时才遍历一次。在 10 万元素的数据集上，比数组链式调用快 2-3 倍。

## 其他值得关注的更新

- 更好的类型推断：在模板字面量类型中
- Array.fromAsync：从异步可迭代对象创建数组
- Promise.withResolvers：更优雅的 Promise 控制`,
      excerpt: 'Iterator.prototype 上的 map/filter/take 等方法正式进入 TypeScript。看看它们如何简化数据管道。',
      category: 'tech',
      created_at: '2026-06-20',
      tags: ['typescript', 'javascript'],
    },
    {
      slug: 'bad-first-draft',
      title: '为什么你应该写"差"的初稿',
      content: `## 完美主义是写作最大的敌人

你有没有这样的经历：打开空白文档，写下第一句话，删掉，重写，再删掉……半小时过去了，屏幕上依然一片空白。

这不是"写作障碍"——这是把编辑和创作混在一起。

## 写作和编辑是两种完全不同的认知活动

- **创作（生成模式）**：需要发散思维，激活大脑默认模式网络
- **编辑（评估模式）**：需要聚焦思维，激活前额叶执行控制

两种模式相互抑制。你无法同时处于两种状态中。

> "写作的第一稿只是你在给自己讲故事。" — Terry Pratchett

## 如何训练自己接受"差"的初稿？

### 方法 1：设定时间限制
给自己 10 分钟，目标是写满一页。不修改、不回看、不删除。

### 方法 2：隐藏你写的字
把字体颜色调成和背景一样，或者把屏幕亮度调到最低。

### 方法 3：从中间开始
引言是最难写的部分——先写你最确定的那一段，引言最后写。

## "好"的初稿不是写出来的，是改出来的

海明威说过："所有初稿都是垃圾。"但他也说过："修改是唯一真正的写作。"

允许自己写"差"的初稿，就是把创作的权力还给自己。先求完成，再求完美。`,
      excerpt: '完美主义是写作最大的敌人。这篇文章论证了先写完再修改的认知科学依据，以及如何训练自己接受不完美的第一稿。',
      category: 'writing',
      created_at: '2026-06-12',
      tags: ['writing-tag', 'creativity'],
    },
  ];

  for (const p of posts) {
    await db.prepare(
      'INSERT OR IGNORE INTO posts (slug, title, content, excerpt, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).bind(p.slug, p.title, p.content, p.excerpt, p.category || null, 'published', p.created_at, p.created_at).run();

    for (const tag of p.tags) {
      await db.prepare('INSERT OR IGNORE INTO post_tags (post_slug, tag_slug) VALUES (?, ?)').bind(p.slug, tag).run();
    }
  }

  // Pages
  await db.prepare('INSERT OR IGNORE INTO pages (slug, title, content, status, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .bind('about', '关于', `## 关于静思录

你好，我是**静思**——一个在全栈工程和分布式系统之间反复横跳的开发者。

这个博客始于 2024 年。当时我发现自己的笔记散落在六个不同的应用里，而搜索引擎越来越难找到"一个普通人写的、经过思考的、不为了 SEO 而存在的内容"。于是就有了静思录。

这里的文章主要围绕三个方向：

- **技术实践**：Rust、TypeScript、系统设计——不是教程翻译，而是踩过坑之后的总结。
- **工具与方法**：编辑器配置、工作流优化、知识管理——追求效率但不沉迷于效率。
- **写作与思考**：关于如何思考、如何写作、如何保持注意力的元话题。

### 写作原则

> "如果你从这篇文章中什么都没学到，至少它不应该浪费你的时间。"

每篇文章发表前我会过三个问题：
1. 六个月后这篇文章还有价值吗？
2. 它说了什么别人没说过的东西？
3. 如果我是读者，我会把它读完吗？

### 技术栈

这个博客本身也是一个持续迭代的 side project。当前架构：Markdown 写作 → Cloudflare Workers 驱动 → D1 数据库。没有评论系统的第三方依赖，没有追踪脚本，没有 Cookie 弹窗。`, 'published', '2026-01-01', '2026-01-01').run();

  await db.prepare('INSERT OR IGNORE INTO pages (slug, title, content, status, created_at, updated_at) VALUES (?,?,?,?,?,?)')
    .bind('links', '友情链接', `## 友情链接

- [代码杂货铺](https://misc.shop) — 一位 Rust 贡献者的技术博客
- [设计乘数](https://designx.sh) — 专注于交互设计与前端工程交叉领域
- [纸上起航](https://sailpaper.cc) — 独立开发者的产品日志
- [不二阅读](https://onlyread.cc) — 每月一篇非虚构书籍深度笔记

想交换友链？给我发邮件，附上你的博客链接和一句话介绍。`, 'published', '2026-01-01', '2026-01-01').run();

  // Comments
  await db.prepare('INSERT OR IGNORE INTO comments (id, post_slug, author, email, body, status, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind('c1', 'knowledge-management-system', '李华', 'lihua@email.com',
      '完全同意"用自己的话重写"这一点。我自己的经验是，如果读完一本书不能用三句话给别人讲清楚，等于没读。另外想问一下，你用的是什么全文搜索工具？',
      'approved', '2026-07-21 14:32').run();

  await db.prepare('INSERT OR IGNORE INTO comments (id, post_slug, author, email, body, status, created_at) VALUES (?,?,?,?,?,?,?)')
    .bind('c2', 'knowledge-management-system', '静思（博主）', 'blog@jingsilu.dev',
      '@李华 感谢分享！我现在用 fzf 做模糊搜索，配合 ripgrep 做精确查找。fzf 的模糊匹配体验很好，而且可以预览匹配行。',
      'approved', '2026-07-21 18:05').run();

}

// 32 字节随机密钥 (hex)
function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}
