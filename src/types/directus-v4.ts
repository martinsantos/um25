/**
 * DIRECTUS V4 TYPES - Sistema de Diseño V4
 *
 * Tipos TypeScript para las colecciones extendidas de Directus:
 * - Servicios (extendido)
 * - Productos (nuevo)
 * - Relación M2M antecedentes_servicios (nuevo)
 */

// ==========================================
// TIPOS BÁSICOS
// ==========================================

export type EstadoPublicacion = 'publicado' | 'borrador';

export interface ArchivoDirectus {
  id: string;
  filename_download: string;
  type: string;
  width?: number;
  height?: number;
  title?: string;
  description?: string;
}

export interface Stat {
  value: string;
  label: string;
}

// ==========================================
// COLECCIÓN: Servicios (EXTENDIDA)
// ==========================================

/**
 * Colección Servicios con campos V4
 * Campos NUEVOS: subtitulo, stats, marcas, por_que_elegirnos, area, slug
 */
export interface ServicioV4 {
  // Campos originales (ya existen en Directus)
  id: number;
  Titulo: string;
  Descripcion: string;
  Imagen?: string; // UUID de Directus
  estado?: EstadoPublicacion;
  date_created?: string;
  date_updated?: string;

  // Campos NUEVOS V4 (a agregar en Directus)
  subtitulo?: string; // String (255 chars) - texto corto para hero
  stats?: Stat[]; // JSON - Array de {value, label}
  marcas?: string[]; // JSON - Array de strings (ej: ['Cisco', 'Ubiquiti'])
  por_que_elegirnos?: string[]; // JSON - Array de bullets
  area?: string; // String - categoría (ej: "Redes", "Seguridad")
  slug?: string; // String (unique) - URL-friendly identifier

  // Relaciones
  productos?: ProductoV4[]; // One-to-Many (reverso de servicio_id)
  antecedentes_relacionados?: AntecedenteServicioRelation[]; // M2M junction
}

// ==========================================
// COLECCIÓN: Productos (NUEVO)
// ==========================================

/**
 * Colección Productos - NUEVA en Directus
 * Productos/soluciones específicas dentro de cada servicio
 */
export interface ProductoV4 {
  id: number;

  // Relación con Servicios (Many-to-One)
  servicio_id: number | ServicioV4; // Required - Foreign Key

  // Contenido del producto
  titulo: string; // Required - String (255 chars)
  descripcion?: string; // Text - Descripción larga (WYSIWYG)
  imagen?: string; // UUID de Directus - Imagen principal

  // Features y detalles
  features?: string[]; // JSON - Array de strings (características)
  destacado?: string; // Text - Texto destacado/diferenciador
  marcas?: string[]; // JSON - Array de strings (marcas relacionadas)

  // Campos comerciales para productos con template propio
  categoria_informacion?: 'PRODUCTO' | string; // Nueva categoría de información
  categoria_comercial?: string; // Ej: Producto
  tipo_producto?: string; // Ej: Producto
  slug_producto?: string; // URL-friendly para resolver el producto
  url_producto?: string; // Alias público/canonical, ej: /cctvai/
  template_producto?: string; // Ej: cctv-ai-operational-single
  imagen_publica?: string; // Asset público cuando no se usa UUID Directus
  contenido_producto?: Record<string, unknown>; // JSON con secciones del template
  opciones_comerciales?: Array<Record<string, unknown>>; // Tabla comercial legacy/Directus

  // Metadatos
  orden?: number; // Integer - Para ordenar productos (default: 0)
  estado?: EstadoPublicacion; // Dropdown - publicado|borrador

  // Timestamps automáticos
  date_created?: string;
  date_updated?: string;
}

// ==========================================
// COLECCIÓN: Antecedentes (EXTENDIDA)
// ==========================================

/**
 * Colección Antecedentes con relación M2M a Servicios
 * Campo NUEVO: servicios_relacionados (M2M)
 */
export interface AntecedenteV4 {
  id: number;
  Nombre: string;
  Descripcion?: string;
  Imagen?: string;
  Titulo?: string;
  Cliente?: string;
  Area?: string;
  Unidad_de_negocio?: string;
  Fecha?: string;
  Presupuesto?: string;
  original_id?: number;
  slug?: string;

  // Campos de ordenamiento por importancia
  destacado?: boolean; // true = aparece primero en listados
  orden?: number; // Mayor = más importante (0 = sin prioridad)

  // Relación M2M (NUEVA)
  servicios_relacionados?: AntecedenteServicioRelation[]; // M2M junction
}

// ==========================================
// JUNCTION TABLE: antecedentes_servicios (M2M)
// ==========================================

/**
 * Tabla junction para relación Many-to-Many
 * Conecta Antecedentes con Servicios
 */
export interface AntecedenteServicioRelation {
  id: number;
  antecedentes_id: number | AntecedenteV4;
  Servicios_id: number | ServicioV4;

  // Campos opcionales para metadatos de la relación
  orden?: number; // Para ordenar servicios dentro de un antecedente
  destacado?: boolean; // Marcar servicio principal del proyecto

  // Timestamps
  date_created?: string;
}

// ==========================================
// SCHEMA DEFINITIONS (para Directus API)
// ==========================================

/**
 * Definiciones de campos para crear/extender colecciones en Directus
 * Estos objetos se pueden usar con la API de Directus para crear el schema
 */

// Campos NUEVOS para colección Servicios
export const SERVICIOS_V4_NUEVOS_CAMPOS = [
  {
    field: 'subtitulo',
    type: 'string',
    meta: {
      interface: 'input',
      options: {
        placeholder: 'Texto corto para hero (ej: "Cableado, Fibra Óptica, Radioenlaces")'
      },
      width: 'full',
      note: 'Texto descriptivo corto que aparece bajo el título en la página del servicio'
    },
    schema: {
      max_length: 255,
      is_nullable: true
    }
  },
  {
    field: 'stats',
    type: 'json',
    meta: {
      interface: 'input-code',
      options: {
        language: 'JSON',
        placeholder: '[{"value": "94+", "label": "Proyectos Completados"}]',
        template: '[\n  {"value": "94+", "label": "Proyectos Completados"},\n  {"value": "22+", "label": "Años de Experiencia"},\n  {"value": "25", "label": "Años de Garantía"},\n  {"value": "24/7", "label": "Soporte Técnico"}\n]'
      },
      width: 'full',
      note: 'Array de estadísticas para mostrar en el hero. Formato: [{"value": "94+", "label": "Texto"}]'
    },
    schema: {
      is_nullable: true
    }
  },
  {
    field: 'marcas',
    type: 'json',
    meta: {
      interface: 'tags',
      options: {
        placeholder: 'Agregar marca (ej: Cisco, Ubiquiti)',
        iconRight: 'local_offer'
      },
      width: 'half',
      note: 'Marcas/fabricantes con los que trabaja este servicio'
    },
    schema: {
      is_nullable: true
    }
  },
  {
    field: 'por_que_elegirnos',
    type: 'json',
    meta: {
      interface: 'list',
      options: {
        placeholder: 'Agregar razón',
        template: '{{ value }}',
        addLabel: 'Agregar Razón'
      },
      width: 'full',
      note: 'Lista de razones por las que elegir este servicio (bullets)'
    },
    schema: {
      is_nullable: true
    }
  },
  {
    field: 'area',
    type: 'string',
    meta: {
      interface: 'select-dropdown',
      options: {
        choices: [
          { text: 'Redes', value: 'Redes' },
          { text: 'Seguridad', value: 'Seguridad' },
          { text: 'Telecomunicaciones', value: 'Telecomunicaciones' },
          { text: 'Software', value: 'Software' },
          { text: 'Soporte', value: 'Soporte' },
          { text: 'Consultoría', value: 'Consultoría' }
        ]
      },
      width: 'half',
      note: 'Área o categoría del servicio'
    },
    schema: {
      max_length: 100,
      is_nullable: true
    }
  },
  {
    field: 'slug',
    type: 'string',
    meta: {
      interface: 'input',
      options: {
        slug: true,
        placeholder: 'URL-friendly (ej: infraestructura-redes)'
      },
      width: 'half',
      note: 'Identificador único para URLs (se auto-genera del título)'
    },
    schema: {
      max_length: 255,
      is_nullable: true,
      is_unique: true
    }
  }
];

// Definición completa de colección Productos
export const PRODUCTOS_COLLECTION_SCHEMA = {
  collection: 'productos',
  meta: {
    icon: 'inventory_2',
    display_template: '{{titulo}}',
    note: 'Productos/soluciones específicas dentro de cada servicio',
    singleton: false,
    translations: [
      {
        language: 'es-ES',
        translation: 'Productos'
      }
    ]
  },
  schema: {
    name: 'productos'
  },
  fields: [
    {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'input',
        readonly: true
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: true
      }
    },
    {
      field: 'servicio_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{Titulo}}'
        },
        width: 'half',
        required: true,
        note: 'Servicio al que pertenece este producto'
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'Servicios',
        foreign_key_column: 'id'
      }
    },
    {
      field: 'titulo',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          placeholder: 'Nombre del producto (ej: "Fibra Óptica de Alta Capacidad")'
        },
        width: 'full',
        required: true
      },
      schema: {
        max_length: 255,
        is_nullable: false
      }
    },
    {
      field: 'descripcion',
      type: 'text',
      meta: {
        interface: 'input-rich-text-html',
        options: {
          toolbar: ['bold', 'italic', 'underline', 'link', 'bullist', 'numlist']
        },
        width: 'full',
        note: 'Descripción completa del producto (acepta HTML)'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'imagen',
      type: 'uuid',
      meta: {
        interface: 'file-image',
        width: 'half',
        note: 'Imagen principal del producto'
      },
      schema: {
        is_nullable: true,
        foreign_key_table: 'directus_files',
        foreign_key_column: 'id'
      }
    },
    {
      field: 'features',
      type: 'json',
      meta: {
        interface: 'list',
        options: {
          placeholder: 'Agregar característica',
          template: '{{ value }}',
          addLabel: 'Agregar Feature'
        },
        width: 'full',
        note: 'Lista de características principales (bullets)'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'destacado',
      type: 'text',
      meta: {
        interface: 'input-multiline',
        options: {
          placeholder: 'Texto destacado o diferenciador del producto'
        },
        width: 'full',
        note: 'Frase destacada que diferencia este producto'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'marcas',
      type: 'json',
      meta: {
        interface: 'tags',
        options: {
          placeholder: 'Agregar marca',
          iconRight: 'local_offer'
        },
        width: 'half',
        note: 'Marcas específicas para este producto'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'categoria_informacion',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Producto', value: 'PRODUCTO' },
            { text: 'Equipamiento', value: 'EQUIPAMIENTO' },
            { text: 'Servicio asociado', value: 'SERVICIO_ASOCIADO' }
          ]
        },
        width: 'half',
        note: 'Categoría editorial/comercial que define cómo se presenta esta información en el sitio'
      },
      schema: {
        default_value: 'EQUIPAMIENTO',
        max_length: 64,
        is_nullable: true
      }
    },
    {
      field: 'categoria_comercial',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          placeholder: 'Producto'
        },
        width: 'half',
        note: 'Etiqueta comercial visible en templates y fichas'
      },
      schema: {
        max_length: 100,
        is_nullable: true
      }
    },
    {
      field: 'tipo_producto',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          placeholder: 'Producto'
        },
        width: 'half',
        note: 'Tipo o familia de producto para render y filtros'
      },
      schema: {
        max_length: 100,
        is_nullable: true
      }
    },
    {
      field: 'slug_producto',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          slug: true,
          placeholder: 'cctv-ai-integrado'
        },
        width: 'half',
        note: 'Identificador estable para resolver la página del producto'
      },
      schema: {
        max_length: 255,
        is_nullable: true,
        is_unique: true
      }
    },
    {
      field: 'url_producto',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          placeholder: '/cctvai/'
        },
        width: 'half',
        note: 'URL pública/canonical del producto cuando tiene single propia'
      },
      schema: {
        max_length: 255,
        is_nullable: true
      }
    },
    {
      field: 'template_producto',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Producto CCTV AI', value: 'cctv-ai-operational-single' },
            { text: 'Producto estándar', value: 'producto-standard' }
          ]
        },
        width: 'half',
        note: 'Template frontend que debe usar este producto'
      },
      schema: {
        max_length: 100,
        is_nullable: true
      }
    },
    {
      field: 'imagen_publica',
      type: 'string',
      meta: {
        interface: 'input',
        options: {
          placeholder: '/images/services/productos/cctv-ai/cctv-ai-integrado-hero.webp'
        },
        width: 'full',
        note: 'Asset público opcional para imágenes generadas fuera de Directus'
      },
      schema: {
        max_length: 500,
        is_nullable: true
      }
    },
    {
      field: 'contenido_producto',
      type: 'json',
      meta: {
        interface: 'input-code',
        options: {
          language: 'JSON',
          template: '{\n  "hero": {},\n  "integrations": [],\n  "options": [],\n  "pilotSteps": [],\n  "demoEvents": [],\n  "limits": []\n}'
        },
        width: 'full',
        note: 'Contenido estructurado que alimenta el template propio del producto'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'opciones_comerciales',
      type: 'json',
      meta: {
        interface: 'input-code',
        options: {
          language: 'JSON',
          template: '[\n  {"modelo": "UMSA", "nombre": "Piloto", "precio_desde_usd": 0}\n]'
        },
        width: 'full',
        note: 'Opciones comerciales comparables para pricing, propuestas y dashboards'
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'orden',
      type: 'integer',
      meta: {
        interface: 'input',
        options: {
          placeholder: '0'
        },
        width: 'half',
        note: 'Orden de aparición (menor número = primero)'
      },
      schema: {
        default_value: 0,
        is_nullable: true
      }
    },
    {
      field: 'estado',
      type: 'string',
      meta: {
        interface: 'select-dropdown',
        options: {
          choices: [
            { text: 'Publicado', value: 'publicado' },
            { text: 'Borrador', value: 'borrador' }
          ]
        },
        width: 'half',
        note: 'Estado de publicación'
      },
      schema: {
        default_value: 'publicado',
        is_nullable: true
      }
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true,
        hidden: true,
        special: ['date-created']
      },
      schema: {
        is_nullable: true
      }
    },
    {
      field: 'date_updated',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true,
        hidden: true,
        special: ['date-updated']
      },
      schema: {
        is_nullable: true
      }
    }
  ]
};

// Definición de relación M2M antecedentes_servicios
export const M2M_ANTECEDENTES_SERVICIOS_SCHEMA = {
  collection: 'antecedentes_servicios',
  meta: {
    icon: 'link',
    hidden: true, // Junction table, no se muestra en el menú
    note: 'Tabla junction para relación M2M entre antecedentes y servicios'
  },
  schema: {
    name: 'antecedentes_servicios'
  },
  fields: [
    {
      field: 'id',
      type: 'integer',
      meta: {
        hidden: true,
        interface: 'input',
        readonly: true
      },
      schema: {
        is_primary_key: true,
        has_auto_increment: true
      }
    },
    {
      field: 'antecedentes_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        hidden: true
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'antecedentes',
        foreign_key_column: 'id'
      }
    },
    {
      field: 'Servicios_id',
      type: 'integer',
      meta: {
        interface: 'select-dropdown-m2o',
        options: {
          template: '{{Titulo}}'
        }
      },
      schema: {
        is_nullable: false,
        foreign_key_table: 'Servicios',
        foreign_key_column: 'id'
      }
    },
    {
      field: 'orden',
      type: 'integer',
      meta: {
        interface: 'input',
        options: {
          placeholder: '0'
        },
        width: 'half',
        note: 'Orden de aparición del servicio en el antecedente'
      },
      schema: {
        default_value: 0,
        is_nullable: true
      }
    },
    {
      field: 'destacado',
      type: 'boolean',
      meta: {
        interface: 'boolean',
        width: 'half',
        note: 'Marcar como servicio principal del proyecto'
      },
      schema: {
        default_value: false,
        is_nullable: true
      }
    },
    {
      field: 'date_created',
      type: 'timestamp',
      meta: {
        interface: 'datetime',
        readonly: true,
        hidden: true,
        special: ['date-created']
      },
      schema: {
        is_nullable: true
      }
    }
  ]
};

// Campo M2M para agregar a colección 'antecedentes'
export const ANTECEDENTES_M2M_FIELD = {
  field: 'servicios_relacionados',
  type: 'alias',
  meta: {
    interface: 'list-m2m',
    options: {
      template: '{{Servicios_id.Titulo}}'
    },
    special: ['m2m'],
    width: 'full',
    note: 'Servicios relacionados con este proyecto/antecedente'
  },
  schema: null
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Convierte datos del formato JS (servicios_completos_v4.js) a formato Directus
 */
export function convertServicioToDirectus(servicioJS: any): Partial<ServicioV4> {
  return {
    id: servicioJS.id,
    Titulo: servicioJS.Titulo,
    Descripcion: servicioJS.Descripcion,
    Imagen: servicioJS.Imagen,
    subtitulo: servicioJS.Subtitulo,
    stats: servicioJS.Stats,
    marcas: servicioJS.Marcas,
    por_que_elegirnos: servicioJS.PorQueElegirnos,
    area: servicioJS.Area,
    slug: servicioJS.Titulo.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim(),
    estado: 'publicado'
  };
}

/**
 * Convierte producto del formato JS a formato Directus
 */
export function convertProductoToDirectus(producto: any, servicioId: number, orden: number): Partial<ProductoV4> {
  return {
    servicio_id: servicioId,
    titulo: producto.titulo,
    descripcion: producto.descripcion,
    imagen: producto.imagen, // Nota: esto requiere migración de imágenes
    features: producto.features,
    destacado: producto.destacado,
    marcas: producto.marcas || [],
    orden: orden,
    estado: 'publicado'
  };
}
