import fs from 'fs';
import path from 'path';
import { editorialImages } from '../src/data/editorialImageSystem';
import { serviceVisualOrder } from '../src/data/serviceVisualSystem';

describe('service visual system', () => {
  test('primary services use unique local editorial thumbnails', () => {
    const images = serviceVisualOrder.map(
      (id) => editorialImages.services[id as keyof typeof editorialImages.services]
    );

    expect(new Set(images).size).toBe(images.length);

    for (const image of images) {
      expect(image).toMatch(/^\/images\/editorial\/.+\.webp$/);
      expect(fs.existsSync(path.join(process.cwd(), 'public', image))).toBe(true);
    }
  });
});
