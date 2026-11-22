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
  if (card.kind === 'layout') {
    const L = JSON.parse(readFileSync(join(root, card.template), 'utf8'));
    writeFileSync(join(root, 'previews', id + '.svg'), wireframe(L, card)); ok++; continue;
  }
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

// layout 카드: 슬롯 와이어프레임 SVG
function wireframe(L, card) {
  const C = { headline: '#1F3A5F', subhead: '#7A8B99', kpi: '#3E7CB1', chart: '#81A4CD', table: '#A9B8C6', commentary: '#D9DEE3',
    footnote: '#EEF0F2', callout: '#F2A541', label: '#7A8B99', column: '#C9D6E3', caption: '#D9DEE3' };
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${L.canvas.w} ${L.canvas.h}" width="800" height="450"><rect width="100%" height="100%" fill="#fff" stroke="#ccc"/>`;
  for (const s of L.slots) {
    const [x, y, w, h] = s.box, col = C[s.role] || '#ddd';
    const [gc, gr] = s.repeat?.grid || [1, 1];
    const n = Math.min(s.repeat?.max || 1, gc * gr);
    for (let i = 0; i < Math.max(1, n); i++) {
      const cw = (w - (gc - 1) * 16) / gc, ch = (h - (gr - 1) * 16) / gr;
      const cx = x + (i % gc) * (cw + 16), cy = y + Math.floor(i / gc) * (ch + 16);
      out += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="8" fill="${col}" fill-opacity="${s.role === 'headline' ? 0.9 : 0.55}"/>`;
    }
    const label = s.role + (s.cards ? ' · ' + s.cards[0] : '');
    out += `<text x="${x + 14}" y="${y + Math.min(34, h - 8)}" font-family="sans-serif" font-size="24" fill="${s.role === 'headline' ? '#fff' : '#1F2933'}">${esc(label)}</text>`;
  }
  return out + `<text x="${L.canvas.w - 20}" y="${L.canvas.h - 14}" text-anchor="end" font-family="sans-serif" font-size="20" fill="#9AA5B1">${esc(card.id)}</text></svg>`;
}
