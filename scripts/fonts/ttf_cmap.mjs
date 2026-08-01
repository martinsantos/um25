import fs from 'node:fs';

function u16(buffer, offset) {
  return buffer.readUInt16BE(offset);
}

function u32(buffer, offset) {
  return buffer.readUInt32BE(offset);
}

/** Read Unicode BMP coverage without relying on the host's font stack. */
export function readTtfCmap(fontPath) {
  const buffer = fs.readFileSync(fontPath);
  const tableCount = u16(buffer, 4);
  let cmapOffset = null;
  for (let index = 0; index < tableCount; index += 1) {
    const offset = 12 + index * 16;
    if (buffer.toString('ascii', offset, offset + 4) === 'cmap') {
      cmapOffset = u32(buffer, offset + 8);
      break;
    }
  }
  if (cmapOffset === null) throw new Error('TTF does not contain a cmap table');

  const records = u16(buffer, cmapOffset + 2);
  let format4Offset = null;
  for (let index = 0; index < records; index += 1) {
    const record = cmapOffset + 4 + index * 8;
    const platform = u16(buffer, record);
    const encoding = u16(buffer, record + 2);
    const subtable = cmapOffset + u32(buffer, record + 4);
    if (u16(buffer, subtable) === 4 && (platform === 3 || (platform === 0 && encoding === 3))) {
      format4Offset = subtable;
      break;
    }
  }
  if (format4Offset === null) throw new Error('TTF does not contain a Unicode BMP format 4 cmap');

  const segCount = u16(buffer, format4Offset + 6) / 2;
  const endCodes = format4Offset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const deltas = startCodes + segCount * 2;
  const ranges = deltas + segCount * 2;

  const has = (codepoint) => {
    if (codepoint > 0xffff) return false;
    for (let index = 0; index < segCount; index += 1) {
      const start = u16(buffer, startCodes + index * 2);
      const end = u16(buffer, endCodes + index * 2);
      if (codepoint < start || codepoint > end) continue;
      const delta = u16(buffer, deltas + index * 2);
      const range = u16(buffer, ranges + index * 2);
      if (range === 0) return ((codepoint + delta) & 0xffff) !== 0;
      const glyphOffset = ranges + index * 2 + range + (codepoint - start) * 2;
      const glyph = u16(buffer, glyphOffset);
      return glyph !== 0 && ((glyph + delta) & 0xffff) !== 0;
    }
    return false;
  };
  return { has };
}

export function missingCodepoints(fontPath, strings) {
  const cmap = readTtfCmap(fontPath);
  const missing = new Map();
  for (const string of strings) {
    for (const character of string) {
      if (/\s/u.test(character)) continue;
      const codepoint = character.codePointAt(0);
      if (!cmap.has(codepoint)) missing.set(character, `U+${codepoint.toString(16).toUpperCase().padStart(4, '0')}`);
    }
  }
  return [...missing.entries()].map(([character, codepoint]) => ({ character, codepoint }));
}
