// Downloads the Unsplash photos listed in public/images/credits.json into public/images/.
// Usage: npm run images
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve('public/images');
const credits = JSON.parse(fs.readFileSync(path.join(dir, 'credits.json'), 'utf8'));

for (const [slot, info] of Object.entries(credits)) {
  const out = path.join(dir, `${slot}.jpg`);
  if (fs.existsSync(out) && !process.argv.includes('--force')) continue;
  const res = await fetch(`${info.src}?w=1600&q=72&fm=jpg&fit=max`);
  if (!res.ok) throw new Error(`${slot}: HTTP ${res.status}`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  console.log('saved', slot);
}
