// ─── D1 database service ───────────────────────────────────

import type { D1Database } from '@cloudflare/workers-types';
import type { Post, PostWithTags, Page, Comment, Tag, Category, Setting, Stats, Media, Revision } from '../types';

export function createDbService(db: D1Database) {
  return {
    // ─── Settings ─────────────────────────────────────────
    async getSetting(key: string): Promise<string | null> {
      const row = await db.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<Setting>();
      return row?.value ?? null;
    },

    async setSetting(key: string, value: string): Promise<void> {
      await db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(key, value).run();
    },

    // ─── Stats ────────────────────────────────────────────
    async getStats(): Promise<Stats> {
      const [posts, comments, tags, categories] = await Promise.all([
        db.prepare('SELECT status, COUNT(*) as count FROM posts GROUP BY status').all<{status: string; count: number}>(),
        db.prepare('SELECT status, COUNT(*) as count FROM comments GROUP BY status').all<{status: string; count: number}>(),
        db.prepare('SELECT COUNT(*) as count FROM tags').first<{count: number}>(),
        db.prepare('SELECT COUNT(*) as count FROM categories').first<{count: number}>(),
      ]);

      const statusMap = (rows: {status: string; count: number}[]) => {
        const m: Record<string, number> = {};
        for (const r of rows) m[r.status] = r.count;
        return m;
      };

      const postCounts = statusMap(posts.results);
      const commentCounts = statusMap(comments.results);

      return {
        total_posts: (postCounts.published || 0) + (postCounts.draft || 0),
        drafts: postCounts.draft || 0,
        total_comments: (commentCounts.approved || 0) + (commentCounts.pending || 0) + (commentCounts.spam || 0),
        pending_comments: commentCounts.pending || 0,
        total_tags: tags?.count ?? 0,
        total_categories: categories?.count ?? 0,
      };
    },

    // ─── Posts ────────────────────────────────────────────
    async getPosts(status?: string): Promise<PostWithTags[]> {
      let sql = `
        SELECT p.*, c.name as category_name
        FROM posts p
        LEFT JOIN categories c ON p.category = c.slug
      `;
      if (status) {
        sql += ' WHERE p.status = ?';
      }
      sql += ' ORDER BY p.created_at DESC';

      const stmt = status
        ? db.prepare(sql).bind(status)
        : db.prepare(sql);

      const { results } = await stmt.all<Post & { category_name: string }>();

      // Fetch tags for each post
      const posts = await Promise.all(
        results.map(async (row) => {
          const { results: tags } = await db.prepare(
            'SELECT t.slug, t.name FROM tags t INNER JOIN post_tags pt ON t.slug = pt.tag_slug WHERE pt.post_slug = ?'
          ).bind(row.slug).all<Tag>();
          return { ...row, tags };
        })
      );

      return posts;
    },

    async getPost(slug: string): Promise<PostWithTags | null> {
      const post = await db.prepare(
        'SELECT p.*, c.name as category_name FROM posts p LEFT JOIN categories c ON p.category = c.slug WHERE p.slug = ?'
      ).bind(slug).first<Post & { category_name: string }>();

      if (!post) return null;

      const { results: tags } = await db.prepare(
        'SELECT t.slug, t.name FROM tags t INNER JOIN post_tags pt ON t.slug = pt.tag_slug WHERE pt.post_slug = ?'
      ).bind(slug).all<Tag>();

      return { ...post, tags };
    },

    async createPost(post: Post): Promise<void> {
      await db.prepare(
        'INSERT INTO posts (slug, title, content, excerpt, category, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(post.slug, post.title, post.content, post.excerpt, post.category || null, post.status, post.created_at, post.updated_at).run();
    },

    async updatePost(slug: string, data: Partial<Post>): Promise<void> {
      const sets: string[] = [];
      const vals: unknown[] = [];

      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'slug' && k !== 'tags') {
          sets.push(`${k} = ?`);
          // 空分类转 NULL, 满足 categories 外键约束 (与 createPost 一致)
          vals.push(k === 'category' && v === '' ? null : v);
        }
      }
      sets.push('updated_at = datetime(\'now\')');
      vals.push(slug);

      if (sets.length === 0) return;
      await db.prepare(`UPDATE posts SET ${sets.join(', ')} WHERE slug = ?`).bind(...vals).run();
    },

    async deletePost(slug: string): Promise<void> {
      await db.batch([
        db.prepare('DELETE FROM post_tags WHERE post_slug = ?').bind(slug),
        db.prepare('DELETE FROM comments WHERE post_slug = ?').bind(slug),
        db.prepare('DELETE FROM posts WHERE slug = ?').bind(slug),
      ]);
    },

    // ─── Post Tags ────────────────────────────────────────
    async setPostTags(postSlug: string, tagSlugs: string[]): Promise<void> {
      const stmts = [
        db.prepare('DELETE FROM post_tags WHERE post_slug = ?').bind(postSlug),
      ];
      for (const tagSlug of tagSlugs) {
        stmts.push(db.prepare('INSERT OR IGNORE INTO post_tags (post_slug, tag_slug) VALUES (?, ?)').bind(postSlug, tagSlug));
      }
      await db.batch(stmts);
    },

    // ─── Pages ────────────────────────────────────────────
    async getPages(): Promise<Page[]> {
      const { results } = await db.prepare('SELECT * FROM pages ORDER BY created_at DESC').all<Page>();
      return results;
    },

    async getPage(slug: string): Promise<Page | null> {
      return db.prepare('SELECT * FROM pages WHERE slug = ?').bind(slug).first<Page>();
    },

    async updatePage(slug: string, data: Partial<Page>): Promise<void> {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'slug') {
          sets.push(`${k} = ?`);
          vals.push(v);
        }
      }
      sets.push('updated_at = datetime(\'now\')');
      vals.push(slug);
      await db.prepare(`UPDATE pages SET ${sets.join(', ')} WHERE slug = ?`).bind(...vals).run();
    },

    // ─── Comments ─────────────────────────────────────────
    async getComments(postSlug?: string, status?: string): Promise<Comment[]> {
      let sql = 'SELECT * FROM comments WHERE 1=1';
      const binds: unknown[] = [];
      if (postSlug) { sql += ' AND post_slug = ?'; binds.push(postSlug); }
      if (status) { sql += ' AND status = ?'; binds.push(status); }
      sql += ' ORDER BY created_at DESC';

      const stmt = binds.length ? db.prepare(sql).bind(...binds) : db.prepare(sql);
      const { results } = await stmt.all<Comment>();
      return results;
    },

    async createComment(comment: Comment): Promise<void> {
      await db.prepare(
        'INSERT INTO comments (id, post_slug, author, email, body, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
      ).bind(comment.id, comment.post_slug, comment.author, comment.email, comment.body, comment.status, comment.created_at).run();
    },

    async updateComment(id: string, data: Partial<Comment>): Promise<void> {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'id') {
          sets.push(`${k} = ?`);
          vals.push(v);
        }
      }
      vals.push(id);
      if (sets.length === 0) return;
      await db.prepare(`UPDATE comments SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
    },

    async deleteComment(id: string): Promise<void> {
      await db.prepare('DELETE FROM comments WHERE id = ?').bind(id).run();
    },

    // ─── Tags ─────────────────────────────────────────────
    async getTags(): Promise<Tag[]> {
      const { results } = await db.prepare(
        'SELECT t.slug, t.name, COUNT(pt.post_slug) as post_count FROM tags t LEFT JOIN post_tags pt ON t.slug = pt.tag_slug GROUP BY t.slug ORDER BY post_count DESC'
      ).all<Tag>();
      return results;
    },

    async createTag(tag: Tag): Promise<void> {
      await db.prepare('INSERT OR IGNORE INTO tags (slug, name) VALUES (?, ?)').bind(tag.slug, tag.name).run();
    },

    async updateTag(slug: string, data: Partial<Tag>): Promise<void> {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'slug') {
          sets.push(`${k} = ?`);
          vals.push(v);
        }
      }
      vals.push(slug);
      if (sets.length === 0) return;
      await db.prepare(`UPDATE tags SET ${sets.join(', ')} WHERE slug = ?`).bind(...vals).run();
    },

    async deleteTag(slug: string): Promise<void> {
      await db.batch([
        db.prepare('DELETE FROM post_tags WHERE tag_slug = ?').bind(slug),
        db.prepare('DELETE FROM tags WHERE slug = ?').bind(slug),
      ]);
    },

    // ─── Categories ───────────────────────────────────────
    async getCategories(): Promise<Category[]> {
      const { results } = await db.prepare(
        'SELECT c.*, COUNT(p.slug) as post_count FROM categories c LEFT JOIN posts p ON c.slug = p.category AND p.status = \'published\' GROUP BY c.slug ORDER BY c.sort_order'
      ).all<Category>();
      return results;
    },

    async createCategory(cat: Category): Promise<void> {
      await db.prepare('INSERT OR IGNORE INTO categories (slug, name, description, sort_order) VALUES (?, ?, ?, ?)')
        .bind(cat.slug, cat.name, cat.description, cat.sort_order).run();
    },

    async updateCategory(slug: string, data: Partial<Category>): Promise<void> {
      const sets: string[] = [];
      const vals: unknown[] = [];
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined && k !== 'slug') {
          sets.push(`${k} = ?`);
          vals.push(v);
        }
      }
      vals.push(slug);
      if (sets.length === 0) return;
      await db.prepare(`UPDATE categories SET ${sets.join(', ')} WHERE slug = ?`).bind(...vals).run();
    },

    async deleteCategory(slug: string): Promise<void> {
      await db.prepare('DELETE FROM categories WHERE slug = ?').bind(slug).run();
    },

    // ─── Media ────────────────────────────────────────────
    async getMediaList(): Promise<Media[]> {
      const { results } = await db.prepare('SELECT * FROM media ORDER BY created_at DESC').all<Media>();
      return results;
    },

    async getMedia(id: string): Promise<Media | null> {
      return db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<Media>();
    },

    async createMedia(media: Media): Promise<void> {
      await db.prepare(
        'INSERT INTO media (id, filename, key, content_type, size, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(media.id, media.filename, media.key, media.content_type, media.size, media.created_at).run();
    },

    async deleteMedia(id: string): Promise<void> {
      await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
    },

    // ─── Revisions (版本历史) ────────────────────────────
    async createRevision(rev: Omit<Revision, 'id'>): Promise<number> {
      const res = await db.prepare(
        `INSERT INTO revisions (entity_type, entity_slug, title, content, excerpt, category, status, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).bind(rev.entity_type, rev.entity_slug, rev.title, rev.content, rev.excerpt, rev.category, rev.status, rev.note, rev.created_at).run();
      return Number(res.meta.last_row_id || 0);
    },

    /** 版本列表 (不含 content, 轻量) */
    async getRevisions(entityType: string, slug: string): Promise<Omit<Revision, 'content'>[]> {
      const { results } = await db.prepare(
        `SELECT id, entity_type, entity_slug, title, excerpt, category, status, note, created_at
         FROM revisions WHERE entity_type = ? AND entity_slug = ?
         ORDER BY id DESC`
      ).bind(entityType, slug).all<Omit<Revision, 'content'>>();
      return results;
    },

    async getRevision(id: number): Promise<Revision | null> {
      return db.prepare('SELECT * FROM revisions WHERE id = ?').bind(id).first<Revision>();
    },

    // ─── Rate limiting (滑动窗口) ─────────────────────────
    /** 计数 +1, 返回当前窗口内次数 */
    async incrRateLimit(key: string, windowSec: number): Promise<number> {
      const now = Math.floor(Date.now() / 1000);
      await db.prepare('DELETE FROM rate_limits WHERE window_start < ?').bind(now - windowSec).run();
      const row = await db.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(key).first<{ count: number }>();
      if (!row) {
        await db.prepare('INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)').bind(key, now).run();
        return 1;
      }
      await db.prepare('UPDATE rate_limits SET count = count + 1 WHERE key = ?').bind(key).run();
      return row.count + 1;
    },

    async resetRateLimit(key: string): Promise<void> {
      await db.prepare('DELETE FROM rate_limits WHERE key = ?').bind(key).run();
    },
  };
}

export type DbService = ReturnType<typeof createDbService>;
