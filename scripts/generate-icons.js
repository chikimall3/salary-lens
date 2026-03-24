/**
 * Generate placeholder PNG icons for the Chrome extension.
 * Creates blue circle icons with "SL" text at 16, 48, and 128px.
 * Run: node scripts/generate-icons.js
 */
import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function crc32(buf) {
  let crc = 0xffffffff;
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[i] = c;
  }
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([len, typeAndData, crc]);
}

function createIcon(size) {
  // RGBA pixel buffer
  const pixels = Buffer.alloc(size * size * 4);
  const cx = size / 2, cy = size / 2;
  const radius = size * 0.44;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);

      if (dist <= radius) {
        // Blue gradient circle
        const t = dist / radius;
        pixels[idx]     = Math.round(26 * (1 - t * 0.3));   // R
        pixels[idx + 1] = Math.round(115 * (1 - t * 0.2));  // G
        pixels[idx + 2] = Math.round(232 * (1 - t * 0.1));  // B
        pixels[idx + 3] = 255;                                // A

        // Draw "S" and "L" as simple pixel patterns for larger sizes
        if (size >= 48) {
          const nx = (x - cx) / radius;
          const ny = (y - cy) / radius;

          // "S" shape (left side)
          const inS = (
            (ny > -0.5 && ny < -0.3 && nx > -0.55 && nx < -0.05) ||
            (ny > -0.5 && ny < -0.1 && nx > -0.55 && nx < -0.35) ||
            (ny > -0.15 && ny < 0.05 && nx > -0.55 && nx < -0.05) ||
            (ny > -0.1 && ny < 0.3 && nx > -0.25 && nx < -0.05) ||
            (ny > 0.1 && ny < 0.3 && nx > -0.55 && nx < -0.05)
          );

          // "L" shape (right side)
          const inL = (
            (ny > -0.5 && ny < 0.3 && nx > 0.05 && nx < 0.25) ||
            (ny > 0.1 && ny < 0.3 && nx > 0.05 && nx < 0.55)
          );

          if (inS || inL) {
            pixels[idx]     = 255;
            pixels[idx + 1] = 255;
            pixels[idx + 2] = 255;
            pixels[idx + 3] = 255;
          }
        }
      } else if (dist <= radius + 1) {
        // Anti-alias edge
        const alpha = Math.max(0, 1 - (dist - radius));
        pixels[idx]     = 26;
        pixels[idx + 1] = 115;
        pixels[idx + 2] = 232;
        pixels[idx + 3] = Math.round(alpha * 255);
      }
    }
  }

  // Build PNG
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // IDAT — add filter byte (0 = None) before each row
  const rawRows = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    rawRows[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(rawRows, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const compressed = deflateSync(rawRows);

  const png = Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);

  return png;
}

for (const size of [16, 48, 128]) {
  const png = createIcon(size);
  writeFileSync(`assets/icon${size}.png`, png);
  console.log(`Created assets/icon${size}.png (${png.length} bytes)`);
}
