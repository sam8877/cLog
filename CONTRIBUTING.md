# 贡献指南

感谢你愿意为静思录贡献代码。请遵循以下约定，让协作更顺畅。

## 开发环境

```bash
cd code
npm install
npm run dev          # http://localhost:8787, 默认密码 admin123 (仅本地)
```

## 运行测试

修改后必须保证两套测试通过：

```bash
npm run test:api           # API 集成测试 (test/api.test.js)
npm run test:e2e           # UI 自动化测试 (test/e2e/)
npx tsc --noEmit           # 类型检查
```

## 代码约定

- 保持现有结构：路由在 `src/index.ts`，数据访问在 `src/services/db.ts`，页面渲染在 `src/templates/`
- 新增页面模板遵循现有 `layoutHtml` 设计系统（CSS tokens 见 `templates/shared.ts`）
- 所有用户可控内容渲染时做 HTML 转义（评论昵称/正文是公开输入，必须转义）
- 修改数据库结构时同时更新 `src/database/schema.sql` 与 `seed.ts` 中的 `ensureSchema()`
- 新增功能需要配套测试：服务端行为加到 `test/api.test.js`，UI 结构与交互加到 `test/e2e/`（UI 断言不写进 API 测试）

## 提交规范

- 提交信息使用 Conventional Commits 风格：`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`
- 提交前确认两套测试 + 类型检查全部通过

## 提 PR

1. 从 `main` 分支切出功能分支
2. 提交变更并推送
3. 创建 PR，描述改动内容和验证方式

## 安全问题

发现安全漏洞请**不要**公开提 Issue——通过邮件或其他私下渠道联系维护者。
