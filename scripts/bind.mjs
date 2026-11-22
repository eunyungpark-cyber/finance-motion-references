// 템플릿 바인더 (참조 구현). 스튜디오의 render-html·render-pptx가 같은 규칙을 따른다.
//
// 입력: template(JSON), rows(첫 행=헤더인 2차원 배열), params(객체)
// 규칙
//  "$DATA"                     → 카드 _binding.format 에 따라 rows 변환
//                                 rows(기본): dataset.source 그대로
//                                 nameValue: [{name, value}]   (pie·funnel·gauge)
//                                 links: [{source,target,value}] (sankey)
//                                 tree: path("a/b/c") 기반 중첩 [{name, value, children}]
//                                 pairs: [[date, value]]       (calendar)
//  {"$seriesPerMeasure": base} → 첫 열을 범주로, 나머지 열마다 series 1개 (orient 'h' 면 x/y 바꿈)
//  {"$seriesPerEntity": base}  → (period, entity, value) 긴 표를 entity별 series로
//  "$PARAM:NAME"               → params.NAME. 없으면 그 키를 통째로 제거(예: 목표선이 없으면 markLine 삭제)
//  "$DERIVE:nodesFromLinks"    → links의 source·target 이름 목록(숫자 없음)
//  "$STAGGER"                  → 순차 등장 지연 함수
//  "$colorBySign": true        → 값 부호로 색 지정
//  "$..." / "_..." 로 시작하는 나머지 키는 설명용 → 제거
// 원칙: 바인더는 원본 값을 바꾸지 않는다. 표시용 변환(누적 base, 100% 비율, band 폭)은 이 파일에서만 하고 원값은 tooltip에 남긴다.

const MISSING = Symbol('missing');

function toFormat(rows, fmt) {
  const [head, ...body] = rows;
  if (!fmt || fmt === 'rows') return rows;
  if (fmt === 'nameValue') return body.map(r => ({ name: r[0], value: r[1] }));
  if (fmt === 'links') return body.map(r => ({ source: r[0], target: r[1], value: r[2] }));
  if (fmt === 'pairs') return body.map(r => [r[0], r[1]]);
  if (fmt === 'tree') {
    const root = [];
    for (const [path, value] of body) {
      let level = root; const parts = String(path).split('/');
      parts.forEach((p, i) => {
        let n = level.find(x => x.name === p);
        if (!n) { n = { name: p }; level.push(n); }
        if (i === parts.length - 1) n.value = value; else level = (n.children ||= []);
      });
    }
    return root;
  }
  throw Error('알 수 없는 format: ' + fmt);
}

function derive(rows, kind) {
  const [head, ...body] = rows; const ix = n => head.indexOf(n);
  if (kind === 'waterfall') {
    let cum = 0; const out = [['label', 'base', 'increase', 'decrease', 'total', 'value']];
    for (const r of body) {
      const v = Number(r[ix('value')]), k = r[ix('kind')];
      if (k === 'total') { out.push([r[0], 0, '-', '-', v, r[ix('value')]]); cum = v; }
      else if (v >= 0) { out.push([r[0], cum, v, '-', '-', r[ix('value')]]); cum += v; }
      else { cum += v; out.push([r[0], cum, '-', -v, '-', r[ix('value')]]); }
    }
    return out;
  }
  if (kind === 'band') return [[...head, 'bandWidth'], ...body.map(r => [...r, Number(r[ix('high')]) - Number(r[ix('low')])])];
  if (kind === 'percentOfRow') return [head, ...body.map(r => { const s = r.slice(1).reduce((a, b) => a + Number(b), 0); return [r[0], ...r.slice(1).map(v => +(Number(v) / s * 100).toFixed(1))]; })];
  return rows;
}

export function bind(template, rows0, params = {}, binding = template._binding || {}) {
  const rows = binding.derive ? derive(rows0, binding.derive) : rows0;
  const head = rows[0];
  const walk = (o, parentKey) => {
    if (Array.isArray(o)) return o.map(v => walk(v)).filter(v => v !== MISSING);
    if (o && typeof o === 'object') {
      if (o.$seriesPerMeasure) {
        const b = o.$seriesPerMeasure, h = b.orient === 'h';
        return head.slice(1).map(name => ({ ...walk(strip(b)), name, encode: h ? { y: head[0], x: name } : { x: head[0], y: name } }));
      }
      if (o.$seriesPerEntity) {
        const b = o.$seriesPerEntity; const ents = [...new Set(rows.slice(1).map(r => r[1]))];
        return ents.map(e => ({ ...walk(strip(b)), name: e, data: rows.slice(1).filter(r => r[1] === e).map(r => [r[0], r[2]]) }));
      }
      const out = {};
      for (const [k, v] of Object.entries(o)) {
        if (k === '$colorBySign') continue;
        if (k.startsWith('$') || k.startsWith('_')) continue;
        const r = walk(v, k); if (r !== MISSING) out[k] = r;
      }
      if (o.$colorBySign) out.itemStyle = { color: p => (Number(p.value?.[1] ?? p.value) < 0 ? '#C8553D' : '#2E6F9E') };
      return out;
    }
    if (o === '$DATA') return toFormat(rows, binding.format);
    if (o === '$STAGGER') return i => i * 80;
    if (o === '$LABEL_ORIGINAL') return p => (p.value && p.value[p.encode?.y?.[0]] === '-' ? '' : String(Array.isArray(p.value) ? p.value[p.value.length - 1] : p.value));
    if (o === '$LABEL_PERCENT') return p => (Array.isArray(p.value) ? p.value[p.encode.y[0]] : p.value) + '%';
    if (o === '$DERIVE:nodesFromLinks') return [...new Set(rows.slice(1).flatMap(r => [r[0], r[1]]))].map(name => ({ name }));
    if (typeof o === 'string' && o.startsWith('$PARAM:')) { const k = o.slice(7); return k in params ? params[k] : MISSING; }
    return o;
  };
  const strip = b => Object.fromEntries(Object.entries(b).filter(([k]) => k !== 'orient'));
  const opt = walk(template);
  // 시리즈 안의 markLine 등 PARAM이 빠져 빈 객체가 된 경우 정리
  for (const s of [].concat(opt.series || [])) for (const k of ['markLine', 'markArea']) if (s[k] && !s[k].data) delete s[k];
  return opt;
}
