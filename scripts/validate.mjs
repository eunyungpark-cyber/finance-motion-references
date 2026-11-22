// 카드 검증 (의존성 없음). 사용: node scripts/validate.mjs
// 검사: 필수 필드, 허용 값, id=파일명, 템플릿 존재·JSON 유효, $DATA 바인딩 존재, 라이선스 허용 목록, 템플릿 크기.
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const schema = JSON.parse(readFileSync(join(root, 'catalog/schema.card.json'), 'utf8'));
const allow = (readFileSync(join(root, 'sources.yaml'), 'utf8').match(/license_allowlist:\s*\[([^\]]*)\]/)?.[1] || '')
  .split(',').map(s => s.trim()).filter(Boolean);
const P = schema.properties;
const errors = [];
const err = (f, m) => errors.push(`${f}: ${m}`);

const dir = join(root, 'catalog/cards');
const files = readdirSync(dir).filter(f => f.endsWith('.json'));
const ids = new Set();
for (const f of files) {
  let c;
  try { c = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch (e) { err(f, 'JSON 파싱 실패'); continue; }
  for (const k of schema.required) if (!(k in c)) err(f, `필수 필드 없음: ${k}`);
  for (const k of Object.keys(c)) if (!(k in P)) err(f, `정의되지 않은 필드: ${k}`);
  if (c.id + '.json' !== f) err(f, 'id와 파일명이 다름');
  if (!new RegExp(P.id.pattern).test(c.id || '')) err(f, 'id 형식 오류');
  if (ids.has(c.id)) err(f, 'id 중복'); ids.add(c.id);
  if (!P.relation.enum.includes(c.relation)) err(f, `relation 값 오류: ${c.relation}`);
  if (!P.pptxMappable.enum.includes(c.pptxMappable)) err(f, 'pptxMappable 값 오류');
  for (const m of c.motion || []) if (!P.motion.items.enum.includes(m)) err(f, `motion 값 오류: ${m}`);
  for (const a of c.audience || []) if (!P.audience.items.enum.includes(a)) err(f, `audience 값 오류: ${a}`);
  const ms = c.dataShape?.measures; if (!ms || ms.min > ms.max) err(f, 'dataShape.measures 범위 오류');
  if (!allow.includes(c.license)) err(f, `허용되지 않은 라이선스: ${c.license}`);
  if (c.source?.kind === 'upstream' && !(c.source.url && c.source.sourceId)) err(f, 'upstream 카드는 source.url·sourceId 필수');
  const tp = join(root, c.template || '');
  if (!c.template || !existsSync(tp)) { err(f, `템플릿 없음: ${c.template}`); continue; }
  if (statSync(tp).size > 64 * 1024) err(f, '템플릿이 64KB 초과');
  const raw = readFileSync(tp, 'utf8');
  try { JSON.parse(raw); } catch { err(f, '템플릿 JSON 파싱 실패'); }
  if (!raw.includes('"$DATA"')) err(f, '템플릿에 $DATA 바인딩 자리가 없음 (값을 템플릿에 직접 넣지 않음)');
  if (/\d{3,}-\d{2,}-\d{4,}/.test(raw)) err(f, '계좌번호로 보이는 숫자 패턴 포함');
  if (c.preview && !existsSync(join(root, c.preview))) err(f, `미리보기 없음: ${c.preview}`);
}
if (errors.length) { console.error(errors.join('\n')); console.error(`\n실패 ${errors.length}건`); process.exit(1); }
console.log(`카드 ${files.length}개 검증 통과`);
