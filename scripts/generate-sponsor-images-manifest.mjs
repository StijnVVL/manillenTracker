/**
 * Scans src/assets/img/sponsors for image files and writes a manifest.json
 * listing their filenames. This lets the app resolve sponsor images
 * dynamically at runtime without ever hardcoding filenames in source code.
 *
 * Runs automatically before `npm run build` / `npm start` / `npm run ng`
 * (see package.json "pre*" script hooks), so simply dropping a new image
 * into the sponsors folder is enough for it to show up in the carousel.
 */
import { readdirSync, writeFileSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sponsorsDir = join(__dirname, '..', 'src', 'assets', 'img', 'sponsors');
const manifestPath = join(sponsorsDir, 'manifest.json');

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']);

const files = readdirSync(sponsorsDir, { withFileTypes: true })
  .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.has(extname(entry.name).toLowerCase()))
  .map(entry => entry.name)
  .sort((a, b) => a.localeCompare(b));

writeFileSync(manifestPath, JSON.stringify(files, null, 2) + '\n');

console.log(`Generated sponsor image manifest with ${files.length} image(s): ${manifestPath}`);
