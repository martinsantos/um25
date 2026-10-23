import fs from 'fs';
import path from 'path';
import { editorialImages } from '../src/data/editorialImageSystem';
import { serviceVisualOrder } from '../src/data/serviceVisualSystem';

describe('service visual system', () => {
  test('primary services use unique Blender poster thumbnails', () => {
    const images = serviceVisualOrder.map(
      (id) => editorialImages.services[id as keyof typeof editorialImages.services]
    );

    expect(new Set(images).size).toBe(images.length);

    for (const image of images) {
      expect(image).toMatch(/^\/cine\/media\/cine-[a-z0-9-]+-poster\.jpg$/);
      expect(fs.existsSync(path.join(process.cwd(), 'public', image))).toBe(true);
    }
  });
});
