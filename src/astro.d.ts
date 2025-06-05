/// <reference types="@astrojs/image/client" />

declare namespace App {
  interface Locals {
    // Define tus tipos locales aquí si es necesario
  }
}

// Extender el espacio de nombres global para Astro
declare global {
  // Interfaz para el objeto Astro global
  interface AstroGlobal {
    request: {
      url: URL;
      canonicalURL: URL;
      params: Record<string, string | undefined>;
    };
    params: Record<string, string | undefined>;
    props: Record<string, any>;
    redirect: (url: string, status?: number) => Response;
    response: ResponseInit & {
      headers: Headers;
    };
    site: URL | undefined;
    slug: string;
    url: URL;
  }

  // Declarar la variable global Astro
  const Astro: AstroGlobal;

  // Interfaz para el objeto global window
  interface Window {
    // Agregar propiedades globales de window si es necesario
  }
}

// Asegurarse de que TypeScript trate este archivo como un módulo
export {};
