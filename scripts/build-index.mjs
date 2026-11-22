// catalog/index.json 생성. 사용: node scripts/build-index.mjs
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const dir = join(root, 'catalog/cards');
const cards = readdirSync(dir).filter(f => f.endsWith('.json')).sort()
  .map(f => JSON.parse(readFileSync(join(dir, f), 'utf8')));
const version = process.env.REF_VERSION || 'dev';
writeFileSync(join(root, 'catalog/index.json'), JSON.stringify({ version, count: cards.length, cards }, null, 2) + '\n');
console.log(`index.json: 카드 ${cards.length}개 (version ${version})`);
