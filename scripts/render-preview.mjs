// 미리보기 SVG 생성: samples/<id>.json(가상 값) + 템플릿 → previews/<id>.svg
// 사용: node scripts/render-preview.mjs [id...]
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { bind } from './bind.mjs';
const require = createRequire(import.meta.url);
const root = new URL('..', import.meta.url).pathname;
const echarts = require(join(root, 'vendor/echarts.min.js'));
const ids = process.argv.slice(2).length ? process.argv.slice(2)
  : readdirSync(join(root, 'catalog/cards')).map(f => f.replace('.json', ''));
let ok = 0; const fails = [];
for (const id of ids) {
  const card = JSON.parse(readFileSync(join(root, 'catalog/cards', id + '.json'), 'utf8'));
  if (card.kind !== 'chart') continue;
  const sp = join(root, 'samples', id + '.json');
  if (!existsSync(sp)) { fails.push(id + ': 샘플 없음'); continue; }
  const sample = JSON.parse(readFileSync(sp, 'utf8'));
  const tpl = JSON.parse(readFileSync(join(root, card.template), 'utf8'));
  try {
    const opt = bind(tpl, sample.rows, sample.params);
    const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 800, height: 450 });
    chart.setOption({ animation: false, textStyle: { fontFamily: "Pretendard, 'Noto Sans KR', sans-serif" }, color: ['#1F3A5F', '#3E7CB1', '#81A4CD', '#C8553D', '#F2A541', '#7A8B99'], ...opt, animation: false });
    const svg = chart.renderToSVGString(); chart.dispose();
    if (svg.length < 800) throw Error('그려진 내용이 거의 없음');
    writeFileSync(join(root, 'previews', id + '.svg'), svg); ok++;
  } catch (e) { fails.push(id + ': ' + e.message); }
}
console.log(`미리보기 ${ok}개 생성`); if (fails.length) { console.error(fails.join('\n')); process.exit(1); }
