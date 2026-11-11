type Variants = { w480: string; w960: string; full: string; ancho: number; avif: string };
export const approvedServiceImages = {
  "102": "/images/aprobadas-20261111/seguridad-2048.webp",
  "107": "/images/aprobadas-20261111/incendios-2048.webp",
  "108": "/images/aprobadas-20261111/energia-2048.webp"
} as const;
export const approvedCaseImages: Record<number, string> = {
  "3484": "/images/antecedentes/generated/aprobadas-20261111/3484-editorial-20261104-principal.webp",
  "3499": "/images/antecedentes/generated/aprobadas-20261111/3499-editorial-20261104-principal.webp",
  "3547": "/images/antecedentes/generated/aprobadas-20261111/3547-editorial-20261104-principal.webp"
};
export const approvedImageVariants: Record<string, Variants> = {
  "/images/aprobadas-20261111/seguridad-2048.webp": {
    "w480": "/images/aprobadas-20261111/seguridad-480.webp",
    "w960": "/images/aprobadas-20261111/seguridad-960.webp",
    "full": "/images/aprobadas-20261111/seguridad-2048.webp",
    "ancho": 2048,
    "avif": "/images/aprobadas-20261111/seguridad-480.avif 480w, /images/aprobadas-20261111/seguridad-960.avif 960w, /images/aprobadas-20261111/seguridad-1536.avif 1536w, /images/aprobadas-20261111/seguridad-2048.avif 2048w"
  },
  "/images/aprobadas-20261111/incendios-2048.webp": {
    "w480": "/images/aprobadas-20261111/incendios-480.webp",
    "w960": "/images/aprobadas-20261111/incendios-960.webp",
    "full": "/images/aprobadas-20261111/incendios-2048.webp",
    "ancho": 2048,
    "avif": "/images/aprobadas-20261111/incendios-480.avif 480w, /images/aprobadas-20261111/incendios-960.avif 960w, /images/aprobadas-20261111/incendios-1536.avif 1536w, /images/aprobadas-20261111/incendios-2048.avif 2048w"
  },
  "/images/aprobadas-20261111/energia-2048.webp": {
    "w480": "/images/aprobadas-20261111/energia-480.webp",
    "w960": "/images/aprobadas-20261111/energia-960.webp",
    "full": "/images/aprobadas-20261111/energia-2048.webp",
    "ancho": 2048,
    "avif": "/images/aprobadas-20261111/energia-480.avif 480w, /images/aprobadas-20261111/energia-960.avif 960w, /images/aprobadas-20261111/energia-1536.avif 1536w, /images/aprobadas-20261111/energia-2048.avif 2048w"
  },
  "/images/antecedentes/generated/aprobadas-20261111/3484-editorial-20261104-principal.webp": {
    "w480": "/images/antecedentes/generated/lote_043/3484-editorial-20261104-principal-480.webp",
    "w960": "/images/antecedentes/generated/lote_043/3484-editorial-20261104-principal-960.webp",
    "full": "/images/antecedentes/generated/aprobadas-20261111/3484-editorial-20261104-principal.webp",
    "ancho": 1536,
    "avif": ""
  },
  "/images/antecedentes/generated/aprobadas-20261111/3499-editorial-20261104-principal.webp": {
    "w480": "/images/antecedentes/generated/lote_044/3499-editorial-20261104-principal-480.webp",
    "w960": "/images/antecedentes/generated/lote_044/3499-editorial-20261104-principal-960.webp",
    "full": "/images/antecedentes/generated/aprobadas-20261111/3499-editorial-20261104-principal.webp",
    "ancho": 1536,
    "avif": ""
  },
  "/images/antecedentes/generated/aprobadas-20261111/3547-editorial-20261104-principal.webp": {
    "w480": "/images/antecedentes/generated/lote_047/3547-editorial-20261104-principal-480.webp",
    "w960": "/images/antecedentes/generated/lote_047/3547-editorial-20261104-principal-960.webp",
    "full": "/images/antecedentes/generated/aprobadas-20261111/3547-editorial-20261104-principal.webp",
    "ancho": 1536,
    "avif": ""
  }
};
