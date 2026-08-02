// ─── Data types for 静思录 blog ────────────────────────────

export interface Post {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}

export interface PostWithTags extends Post {
  tags: Tag[];
  category_name?: string;
}

export interface Page {
  slug: string;
  title: string;
  content: string;
  status: 'draft' | 'published';
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_slug: string;
  author: string;
  email: string;
  body: string;
  status: 'pending' | 'approved' | 'spam';
  created_at: string;
}

export interface Tag {
  slug: string;
  name: string;
  post_count?: number;
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  sort_order: number;
  post_count?: number;
}

export interface Setting {
  key: string;
  value: string;
}

export interface Media {
  id: string;
  filename: string;
  key: string;
  content_type: string;
  size: number;
  created_at: string;
}

export interface Revision {
  id: number;
  entity_type: 'post' | 'page';
  entity_slug: string;
  title: string;
  content: string;
  excerpt: string;
  category: string;
  status: 'draft' | 'published';
  note: string;
  created_at: string;
}

export interface Stats {
  total_posts: number;
  drafts: number;
  total_comments: number;
  pending_comments: number;
  total_tags: number;
  total_categories: number;
}

export interface JwtPayload {
  sub: 'admin';
  iat: number;
  exp: number;
}
