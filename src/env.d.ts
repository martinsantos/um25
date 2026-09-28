/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly UMSA_LOCAL_REPLICA?: string;
  readonly PUBLIC_DIRECTUS_URL: string;
  readonly DIRECTUS_STATIC_TOKEN: string;
  readonly PUBLIC_DIRECTUS_TOKEN?: string;
  readonly DIRECTUS_INTERNAL_URL?: string;
  readonly DIRECTUS_ADMIN_TOKEN?: string;
  readonly DIRECTUS_WEBHOOK_SECRET?: string;
  readonly COMMENTS_ADMIN_SECRET?: string;
  readonly COMMENT_MODERATION_SECRET?: string;
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

declare namespace App {
  interface Locals {
    /**
     * Migas explícitas para BreadcrumbList: una página las fija en su frontmatter
     * cuando la jerarquía temática no coincide con la ruta (p. ej. Blog → Tema → Nota).
     * SEOHead las prioriza sobre las derivadas de la URL.
     */
    seoBreadcrumbs?: Array<{ name: string; url: string }>;
  }
}
