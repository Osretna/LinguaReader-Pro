const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPNG(width, height, r, g, b, a = 255) {
  // 8-byte PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth: 8
  ihdrData[9] = 6; // color type: 6 (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Raw image data: height scanlines, each starting with filter byte 0 followed by width * 4 bytes RGBA
  const rawData = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    rawData[offset++] = 0; // Filter byte: None
    for (let x = 0; x < width; x++) {
      // Draw rounded squircle and center emblem highlight
      const cx = width / 2;
      const cy = height / 2;
      const dx = Math.abs(x - cx);
      const dy = Math.abs(y - cy);
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Gradient from #4f46e5 (79, 70, 229) to #7c3aed (124, 58, 237)
      const gradRatio = (x + y) / (width + height);
      let curR = Math.round(79 + (124 - 79) * gradRatio);
      let curG = Math.round(70 + (58 - 70) * gradRatio);
      let curB = Math.round(229 + (237 - 229) * gradRatio);

      // Book icon silhouette in center (white)
      const innerW = width * 0.28;
      const innerH = height * 0.22;
      if (dx < innerW && dy < innerH && (dx > 4 || dy > 8)) {
        curR = 255;
        curG = 255;
        curB = 255;
      }

      rawData[offset++] = curR;
      rawData[offset++] = curG;
      rawData[offset++] = curB;
      rawData[offset++] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // Calculate CRC
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    crcTable[n] = c;
  }
  return crcTable;
}

function crc32(buf) {
  const table = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const pubDir = path.resolve(__dirname, '../public');
fs.writeFileSync(path.join(pubDir, 'icon-192.png'), createPNG(192, 192));
fs.writeFileSync(path.join(pubDir, 'icon-512.png'), createPNG(512, 512));
fs.writeFileSync(path.join(pubDir, 'icon-512-maskable.png'), createPNG(512, 512));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPNG(180, 180));
console.log('Successfully generated PNG icons in /public!');
