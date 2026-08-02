// ─── Playwright E2E 配置 ──────────────────────────────────
// 覆盖场景: 公开页/后台 SPA 的 JS 崩溃、交互流程、XSS 渲染
// 依赖: wrangler dev --local 在 8787 端口运行 (webServer 自动启动/复用)

import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 30_000,
  // 串行: 测试会读写同一 D1 数据库 (改密码/改标题/建删数据), 避免跨测试状态干扰
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8787',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8787',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
