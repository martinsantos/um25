/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_DIRECTUS_URL: string;
  readonly DIRECTUS_STATIC_TOKEN: string;
  readonly PUBLIC_DIRECTUS_TOKEN?: string;
  readonly DIRECTUS_INTERNAL_URL?: string;
  readonly DIRECTUS_ADMIN_TOKEN?: string;
  readonly BLOG_API_USER?: string;
  readonly BLOG_API_PASS?: string;
  readonly BLOG_SKILL_USER?: string;
  readonly BLOG_SKILL_PASS?: string;
  readonly BLOG_SKILL_PATH?: string;
  readonly BLOG_SKILL_MARKDOWN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
