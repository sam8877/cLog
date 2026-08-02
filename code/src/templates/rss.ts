// ─── RSS 2.0 Feed Template ────────────────────────────────

import { renderMarkdown, stripMarkdown } from '../services/markdown';
import type { PostWithTags } from '../types';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function rfc822Date(d: string): string {
  const dt = new Date(d + (d.includes('T') ? '' : 'T00:00:00'));
  return isNaN(dt.getTime()) ? new Date().toUTCString() : dt.toUTCString();
}

export function rssXml(opts: {
  posts: PostWithTags[];
  title: string;
  description: string;
  siteUrl: string; // 站点根 URL, 用于生成绝对链接
}): string {
  const { posts, title, description, siteUrl } = opts;
  const base = siteUrl.replace(/\/$/, '');

  const items = posts.map(p => {
    const link = `${base}/post/${p.slug}`;
    const excerpt = escapeXml(stripMarkdown(p.excerpt || p.content || '', 300));
    const content = renderMarkdown(p.content || '');
    const tags = (p.tags || []).map(t => `<category>${escapeXml(t.name)}</category>`).join('');
    return `
  <item>
    <title>${escapeXml(p.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="false">${escapeXml(p.slug)}</guid>
    <pubDate>${rfc822Date(p.created_at || '')}</pubDate>
    <description>${excerpt}</description>
    <content:encoded><![CDATA[${content}]]></content:encoded>
    ${tags}
  </item>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${base || '/'}</link>
    <description>${escapeXml(description)}</description>
    <atom:link href="${base}/rss.xml" rel="self" type="application/rss+xml" />
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`;
}
