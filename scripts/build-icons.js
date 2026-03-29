import sharp from 'sharp';
import ico from 'sharp-ico';
import fs from 'fs';
import path from 'path';

/* This script generates PNG icons of various sizes and a favicon.ico from a single source image.
To run:
   node scripts/build-icons.js <path-to-source.png>

Make sure to install the dependencies first:
   pnpm add -D sharp sharp-ico -w
If you need to remove them later:
   pnpm remove sharp sharp-ico -w
*/

// Settings
const INPUT_FILE = '<file>.png'; // Your source file
const OUTPUT_DIR = './apps/extension/public/icons';
const SIZES = [16, 32, 48, 128];

async function generate() {
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const pngBuffers = [];

    for (const size of SIZES) {
        const outputPath = path.join(OUTPUT_DIR, `icon${size}.png`);

        // Resize and optimize
        const buffer = await sharp(INPUT_FILE)
            .resize(size, size)
            .png()
            .toBuffer();

        fs.writeFileSync(outputPath, buffer);
        pngBuffers.push(buffer);
        console.log(`✅ Created ${size}x${size} PNG`);
    }

    // Create the .ico file (contains multiple sizes for Windows/Favicons)
    const icoBuffer = await ico.encode(pngBuffers);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'favicon.ico'), icoBuffer);
    console.log(`✅ Created favicon.ico`);
}

generate().catch(err => console.error("❌ Error:", err));