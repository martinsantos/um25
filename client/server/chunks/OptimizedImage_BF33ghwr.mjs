import { b as createAstro, c as createComponent, m as maybeRenderHead, e as addAttribute, a as renderTemplate } from './astro/server_B7qweUek.mjs';
import 'kleur/colors';
import 'clsx';
import NodeCache from 'node-cache';
import sharp from 'sharp';
import { promises } from 'fs';
import path from 'path';
/* empty css                          */

const cache = new NodeCache({
  stdTTL: 3600,
  // 1 hora de tiempo de vida
  checkperiod: 600
  // Revisar caducidad cada 10 minutos
});
const CACHE_DIR = path.join(process.cwd(), "public", "cache");
const DEFAULT_IMAGE = "/images/default.jpg";
async function ensureCacheDir() {
  try {
    await promises.access(CACHE_DIR);
  } catch {
    await promises.mkdir(CACHE_DIR, { recursive: true });
  }
}
function generateImageKey(imagePath, width, height, format) {
  const key = `${imagePath}-${width}-${height || "auto"}-${format || "original"}`;
  return key.replace(/[^a-z0-9]/gi, "_");
}
async function processAndCacheImage(imagePath, width, height, format = "webp") {
  await ensureCacheDir();
  const cacheKey = generateImageKey(imagePath, width, height, format);
  const cachedPath = path.join(CACHE_DIR, `${cacheKey}.${format}`);
  if (cache.has(cacheKey)) {
    return cachedPath;
  }
  try {
    try {
      await promises.access(cachedPath);
      cache.set(cacheKey, cachedPath);
      return cachedPath;
    } catch {
    }
    const absoluteImagePath = path.join(process.cwd(), "public", imagePath);
    let sourceImage;
    try {
      await promises.access(absoluteImagePath);
      sourceImage = absoluteImagePath;
    } catch {
      sourceImage = path.join(process.cwd(), "public", DEFAULT_IMAGE);
      console.warn(`Imagen no encontrada: ${imagePath}, usando imagen por defecto`);
    }
    let sharpInstance = sharp(sourceImage).resize(width, height, {
      fit: "cover",
      position: "center"
    });
    switch (format) {
      case "jpeg":
        sharpInstance = sharpInstance.jpeg({ quality: 80 });
        break;
      case "webp":
        sharpInstance = sharpInstance.webp({ quality: 80 });
        break;
      case "png":
        sharpInstance = sharpInstance.png({ quality: 80 });
        break;
    }
    await sharpInstance.toFile(cachedPath);
    cache.set(cacheKey, cachedPath);
    return cachedPath;
  } catch (error) {
    console.error("Error procesando imagen:", error);
    throw error;
  }
}

const $$Astro = createAstro("http://localhost:4321");
const $$OptimizedImage = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$OptimizedImage;
  const {
    src = "/images/default.jpg",
    alt,
    class: className,
    width = 800,
    height,
    loading = "lazy"
  } = Astro2.props;
  const imageSrc = src || "/images/default.jpg";
  const formats = ["webp", "jpeg"];
  const sizes = [width, width * 2].filter((w) => w <= 1920);
  const imageUrls = await Promise.all(
    formats.flatMap(
      (format) => sizes.map(async (size) => ({
        url: (await processAndCacheImage(imageSrc, size, height, format)).replace(/^public/, ""),
        size,
        format
      }))
    )
  );
  const imagesByFormat = formats.reduce((acc, format) => {
    acc[format] = imageUrls.filter((img) => img.format === format);
    return acc;
  }, {});
  const srcsets = formats.map((format) => ({
    type: `image/${format}`,
    srcset: imagesByFormat[format].map((img) => `${img.url} ${img.size}w`).join(", ")
  }));
  const mainImage = imagesByFormat.webp[0];
  return renderTemplate`${maybeRenderHead()}<picture data-astro-cid-x4ppssot> ${srcsets.map(({ type, srcset }) => renderTemplate`<source${addAttribute(type, "type")}${addAttribute(srcset, "srcset")} sizes="(max-width: 768px) 100vw, 800px" data-astro-cid-x4ppssot>`)} <img${addAttribute(mainImage.url, "src")}${addAttribute(alt, "alt")}${addAttribute(className, "class")}${addAttribute(width, "width")}${addAttribute(height, "height")}${addAttribute(loading, "loading")} decoding="async" data-astro-cid-x4ppssot> </picture> `;
}, "/Users/Shared/Files From d.localized/D/ultima milla/2024/MKT 2024/umw141024/umw46-main/fumbling-field/src/components/OptimizedImage.astro", void 0);

export { $$OptimizedImage as $ };
