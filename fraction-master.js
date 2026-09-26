// 12단계: 답을 먼저 남기고, 모델로 검증·수정한 뒤 설명을 기록합니다.
(() => {
  const host = document.querySelector('#master-content'), nav = document.querySelector('#master-steps');
  const titles = ['먼저 예상하라', '내 전략 고르기', '모델 없이 해결', '내 답을 모델로 증명', '내 답 수정하기', '답과 설명은 별개!', '분수 미스터리', '누가 맞을까?', '모델 없이 도전', '나의 설명 카드', '유형이 섞인 미션', '분수 마스터 성'];
  const tools = ['🟦 분수 막대', '✂️ 다시 나누기', '🧩 다시 묶기', '🎯 공통 단위 찾기', '👀 겹쳐 비교하기', '➕ 합치기 / ➖ 빼기'];
  const primary = { id: 'first', pair: [[3, 4], [2, 3]], op: '+', baseline: 1 };
  const correction = { id: 'correction', pair: [[2, 3], [1, 4]], op: '+', baseline: 1 };
  const independent = { id: 'independent', pair: [[5, 6], [2, 9]], op: '−', baseline: .5 };
  const castle = { id: 'castle', pair: [[2, 3], [3, 5]], op: '+', baseline: 1 };
  const sessions = Object.fromEntries([primary, correction, independent, castle].map(p => [p.id, { phase: 0, history: [], strategy: [] }]));
  const states = titles.map(() => ({})); let step = 0, storageFailed = false;
  let cards = [];
  try { const saved = JSON.parse(localStorage.getItem('fraction-master-cards-v1') || '[]'); if (Array.isArray(saved)) cards = saved.filter(c => c && typeof c.title === 'string' && Array.isArray(c.pair) && Number.isInteger(c.d) && c.d > 0 && c.d <= 60 && Number.isInteger(c.n)).slice(-30); } catch { storageFailed = true; }
  const add = (p, tag, text = '', cls = '') => { const e = document.createElement(tag); e.textContent = text; e.className = cls; p.append(e); return e; };
  function button(p, text, fn) { const b = add(p, 'button', text); b.type = 'button'; b.onclick = fn; return b; }
  const say = (p, text) => add(p, 'p', text, 'master-instruction');
  function feedback(p, text = '') { const m = add(p, 'p', text, 'master-feedback'); m.setAttribute('role', 'status'); return m; }
  function frac(p, v) { const f = add(p, 'span', '', 'reading-fraction'); f.setAttribute('role', 'img'); f.setAttribute('aria-label', `${v[1]}분의 ${v[0]}`); for (const [cls, n] of [['reading-top', v[0]], ['reading-bottom', v[1]]]) { const s = add(f, 'span', String(n), cls); s.setAttribute('aria-hidden', 'true'); } return f; }
  function equation(p, a, b, sign = '=') { const row = add(p, 'div', '', 'master-equation'); frac(row, a); add(row, 'span', sign); frac(row, b); return row; }
  function expression(p, task, result) { const row = equation(p, ...task.pair, task.op); if (result) { add(row, 'span', '='); frac(row, result); } return row; }
  const value = v => v[0] / v[1], equal = (a, b) => Math.abs(value(a) - value(b)) < 1e-10;
  const convert = (v, d) => [v[0] * d / v[1], d];
  const valid = (pair, d) => Number.isInteger(d) && d >= 2 && d <= 60 && pair.every(v => d % v[1] === 0);
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const common = pair => pair[0][1] * pair[1][1] / gcd(pair[0][1], pair[1][1]);
  const total = (task, d) => convert(task.pair[0], d)[0] + (task.op === '+' ? 1 : -1) * convert(task.pair[1], d)[0];
  function input(p, label, initial) { const l = add(p, 'label', label), i = add(l, 'input'); i.type = 'number'; i.min = '0'; i.max = '240'; i.step = '1'; i.required = true; i.inputMode = 'numeric'; i.setAttribute('aria-label', label); if (initial !== undefined) i.value = String(initial); return i; }
  function form(p, labels, action, fn, values = []) { const f = add(p, 'form', '', 'master-form'), fields = labels.map((label, i) => input(f, label, values[i])); const b = add(f, 'button', action); b.type = 'submit'; const m = feedback(p); f.onsubmit = e => { e.preventDefault(); const result = fields.map(i => Number(i.value)); if (!result.every(Number.isInteger)) { m.textContent = '조각의 개수와 나눈 수를 정수로 적어 주세요.'; return; } fn(result, m); }; }
  function model(p, n, d, label, { count = Math.max(1, Math.ceil(n / d)), click, first = n, symbols = true } = {}) {
    const row = add(p, 'div', '', 'master-model'), head = add(row, 'div', '', 'master-model-title'); add(head, 'strong', label); if (symbols) frac(head, [n, d]);
    if (count > 4) { say(row, '양이 커서 처음 전체 4개까지만 그렸어요. 입력한 분수의 크기를 다시 살펴보세요.'); count = 4; }
    for (let whole = 0; whole < count; whole++) { if (count > 1) add(row, 'small', `${whole + 1}번째 전체`); const bar = add(row, 'div', '', 'master-bar'); bar.style.gridTemplateColumns = `repeat(${d},minmax(0,1fr))`; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', `${label} ${whole + 1}번째 전체`);
      for (let i = 0; i < d; i++) { const index = whole * d + i; const cell = add(bar, click ? 'button' : 'span', '', `master-cell${index < n ? index < first ? ' filled' : ' added' : ''}`); if (click) { cell.type = 'button'; cell.setAttribute('aria-label', `${label} ${index + 1}번째 칸`); cell.setAttribute('aria-pressed', String(index < n)); cell.onclick = () => click(index < n ? index : index + 1); } }
    } return row;
  }
  function overlay(p, a, b) { const board = add(p, 'div', '', 'master-overlay'); const maxWholes = Math.max(1, Math.ceil(value(a)), Math.ceil(value(b))); for (const [v, cls] of [[a, 'a'], [b, 'b']]) { const fill = add(board, 'div', '', cls); fill.style.width = value(v) / maxWholes * 100 + '%'; } say(p, `같은 전체 ${maxWholes}개 길이에서 파란색과 주황색의 끝을 비교하세요.`); }
  function prediction(p, task, s) { expression(p, task); const base = task.baseline === 1 ? '1' : '1/2'; say(p, '정확하게 계산하기 전에 결과를 예상해 보세요. 예상은 아직 채점하지 않아요.'); const row = add(p, 'div', '', 'master-actions'); for (const [text, sign] of [[`${base}보다 작다`, -1], [`${base}과 같다`, 0], [`${base}보다 크다`, 1]]) { const b = button(row, text, () => { s.prediction = sign; render(); }); b.setAttribute('aria-pressed', String(s.prediction === sign)); } if (s.prediction !== undefined) feedback(p, `📌 나의 예상: ${base}${s.prediction === 0 ? '과 같다' : s.prediction < 0 ? '보다 작다' : '보다 크다'}`); }
  function strategy(p, s) { say(p, '어떤 도구가 필요할까요? 여러 개 골라도 좋아요. 모델은 내 답을 남긴 뒤 검증할 때 열어요.'); const row = add(p, 'div', '', 'master-actions'); for (const name of tools) { const b = button(row, name, () => { s.strategy.includes(name) ? s.strategy.splice(s.strategy.indexOf(name), 1) : s.strategy.push(name); render(); }); b.setAttribute('aria-pressed', String(s.strategy.includes(name))); } }
  function draftForm(p, task, s, revision = false) {
    expression(p, task); say(p, revision ? '처음 답은 기록에 남습니다. 모델에서 확인한 내용으로 내 답을 수정해 보세요.' : '모델 없이 먼저 계산해 보세요. 여기서는 채점하지 않고 내 풀이를 기록해요.');
    const labels = ['내 공통분모', 'A의 바꾼 분자', 'B의 바꾼 분자', '내 답의 분자', '내 답의 분모'];
    form(p, labels, revision ? '수정한 답 기록' : '내 풀이 기록', ([d, a, b, n, den], m) => {
      if (d < 2 || d > 60 || den < 1 || den > 60 || n > 120 || a > 120 || b > 120) { m.textContent = '분모는 1~60, 공통분모는 2~60, 조각 수는 0~120 범위로 적어 주세요.'; return; }
      s.draft = { d, a, b, n, den }; s.history.push({ ...s.draft }); s.verified = false; s.explained = false; s.revising = false;
      if (!s.proof) s.proof = { d: valid(task.pair, d) ? d : null, counts: [0, 0], moved: 0 };
      if (revision) s.proof.compare = true;
      render();
    }, s.draft ? Object.values(s.draft) : []);
    if (s.draft) { feedback(p, revision ? '수정할 내용을 적고 기록하세요.' : '내 풀이를 기록했어요. 이제 모델로 증명해 볼까요?'); expression(p, task, [s.draft.n, s.draft.den]); }
  }
  // 모든 도구는 계산을 먼저 기록한 후 검증 화면에서 직접 조작할 수 있습니다.
  function workbench(p, task, s) {
    s.work ??= { values: task.pair.map(v => [...v]), active: null }; const w = s.work;
    const details = add(p, 'details', '', 'master-tools'); add(details, 'summary', '🧰 검증 도구 상자 열기'); details.open = !!w.active;
    const choices = add(details, 'div', '', 'master-actions'); tools.forEach((name, i) => button(choices, name, () => { w.active = i; if (!s.strategy.includes(name)) s.strategy.push(name); render(); }));
    if (w.active === null) return;
    const m = feedback(details);
    if (w.active === 3) { FractionTools.denominatorPicker(details, task.pair, w, render, d => { w.values = task.pair.map(v => convert(v, d)); w.d = d; render(); }, 60); }
    if (w.active !== 3 || w.d) {
      w.values.forEach((v, i) => { model(details, ...v, `${i ? 'B' : 'A'} 도구 막대`); if (w.active === 1 || w.active === 2) for (const k of [2, 3]) button(details, `${i ? 'B' : 'A'} ${k}${w.active === 1 ? '배로 나누기' : '칸씩 묶기'}`, () => { if (w.active === 1) { if (v[1] * k > 60) { m.textContent = '60등분까지 탐구해요.'; return; } w.values[i] = v.map(n => n * k); } else { if (v[0] % k || v[1] % k || v[1] / k < 1) { m.textContent = '색칠 경계와 전체가 함께 맞는 수로 묶어 보세요.'; return; } w.values[i] = v.map(n => n / k); } render(); }); });
      if (w.active === 4) { overlay(details, ...w.values); say(details, '이 겹치기는 두 항 자체의 크기를 비교하는 도구예요. 합이나 차의 결과는 아래 증명 막대에서 확인하세요.'); }
      if (w.active === 5) { if (w.values[0][1] !== w.values[1][1]) say(details, '조각 크기가 달라요. 먼저 같은 단위로 바꾸어 보세요.'); else { const d = w.values[0][1]; const n = w.values[0][0] + (task.op === '+' ? 1 : -1) * w.values[1][0]; model(details, n, d, '도구로 검산한 결과', { first: w.values[0][0] }); } }
    }
  }
  function proof(p, task, s) {
    if (!s.draft) { say(p, '내 풀이를 먼저 기록한 뒤 증명할 수 있어요.'); return; }
    const q = s.proof; workbench(p, task, s);
    if (!q.d) { say(p, '두 원래 분수를 같은 크기의 조각으로 나타낼 공통분모를 직접 찾아보세요.'); FractionTools.denominatorPicker(p, task.pair, q, render, d => { q.d = d; q.counts = [0, 0]; render(); }, 60); return; }
    const d = q.d, expected = task.pair.map(v => convert(v, d)[0]), result = total(task, d);
    if (!q.built) {
      say(p, `증명에 쓸 단위는 ${d}분의 1입니다. 빈 막대를 직접 색칠해 원래 두 분수를 만드세요.`);
      task.pair.forEach((v, i) => { const label = i ? 'B 증명 막대' : 'A 증명 막대'; const title = add(p, 'div', '', 'master-equation'); add(title, 'span', `${i ? 'B' : 'A'}에 만들 양`); frac(title, v);
        model(p, q.counts[i], d, label, { click: n => { q.counts[i] = n; render(); } });
        const row = add(p, 'div', '', 'master-actions'); const minus = button(row, `${i ? 'B' : 'A'} 한 칸 지우기`, () => { q.counts[i]--; render(); }); minus.disabled = q.counts[i] === 0; const plus = button(row, `${i ? 'B' : 'A'} 한 칸 색칠하기`, () => { q.counts[i]++; render(); }); plus.disabled = q.counts[i] >= d;
      });
      const m = feedback(p); button(p, '원래 분수와 모델 확인', () => { if (q.counts.some((n, i) => n !== expected[i])) { m.textContent = '같은 전체에서 원래 분수가 나타내는 양만큼 색칠했는지 다시 살펴보세요.'; return; } q.built = true; render(); }); return;
    }
    task.pair.forEach((v, i) => equation(p, v, [q.counts[i], d]));
    const current = q.counts[0] + (task.op === '+' ? 1 : -1) * q.moved;
    model(p, current, d, '내가 구성하는 결과', { count: Math.max(1, Math.ceil(result / d)), first: q.counts[0] });
    say(p, `B의 ${expected[1]}조각 중 ${q.moved}조각을 ${task.op === '+' ? '합쳤어요' : '뺐어요'}.`);
    if (q.moved < expected[1]) button(p, task.op === '+' ? 'B 조각 하나 합치기' : 'B 조각 하나 빼기', () => { q.moved++; render(); });
    if (q.moved) button(p, '이동한 조각 하나 되돌리기', () => { q.moved--; q.compare = false; s.verified = false; s.explained = false; render(); });
    if (q.moved !== expected[1]) return;
    button(p, '내 답과 모델 비교', () => { q.compare = true; render(); });
    if (!q.compare) return;
    const answer = s.draft; model(p, answer.n, answer.den, '처음 또는 수정한 내 답'); overlay(p, [answer.n, answer.den], [result, d]);
    const termsMatch = valid(task.pair, answer.d) && answer.a === convert(task.pair[0], answer.d)[0] && answer.b === convert(task.pair[1], answer.d)[0];
    const matches = equal([answer.n, answer.den], [result, d]) && termsMatch;
    if (!matches) { feedback(p, '모델과 내 풀이 기록을 비교해 보세요. 색칠한 양이나 통분 과정에 차이가 있나요? 내 답을 수정할 수 있어요.'); s.revising = true; }
    else { s.verified = true; feedback(p, s.history.length > 1 ? '✨ 모델을 이용해 스스로 풀이를 수정하고 확인했어요.' : '내 풀이와 직접 만든 모델이 같은 양을 나타내요!'); const sign = Math.sign(result / d - task.baseline); say(p, sign === s.prediction ? '처음 예상과 실제 결과가 일치해요.' : '처음 예상과 다른 결과를 발견했어요. 근거를 보고 생각을 바꾸어도 좋아요.');
      if (result >= d) { const row = add(p, 'div', '', 'master-equation'); frac(row, [result, d]); add(row, 'span', '='); add(row, 'strong', String(Math.floor(result / d))); if (result % d) frac(row, [result % d, d]); }
    }
    if (s.revising) draftForm(p, task, s, true);
  }
  function finishExplanation(p, task, s) {
    if (!s.verified) return;
    say(p, '왜 이 방법으로 계산할 수 있었나요?'); const m = feedback(p);
    button(p, '같은 크기의 단위 조각으로 바꾸어 조각의 개수를 계산했어요', () => { s.reason = true; render(); });
    button(p, '분자와 분모를 각각 계산하면 되니까요', () => { m.textContent = '분모는 단위 조각의 크기와 연결돼요. 내가 만든 모델을 다시 떠올려 보세요.'; });
    if (!s.reason) return;
    const d = s.proof.d, n = total(task, d);
    form(p, ['설명의 공통 단위 분모', '설명의 결과 조각 수'], '설명 카드 완성', ([unit, count], msg) => { if (unit !== d || count !== n) { msg.textContent = '직접 만든 증명 막대의 한 조각과 결과의 조각 수를 설명해 보세요.'; return; } s.explained = true; saveCard(task, s); render(); });
    if (s.explained) { feedback(p, '★★★ 정답뿐 아니라 모델과 이유까지 증명했어요!'); renderCard(p, cards.find(c => c.id === task.id), false); }
  }
  function saveCard(task, s) {
    const d = s.proof.d, n = total(task, d); const c = { id: task.id, title: '🏆 나의 분수 증명', pair: task.pair, op: task.op, baseline: task.baseline, prediction: s.prediction, strategy: [...s.strategy], draft: { ...s.draft }, history: s.history.map(v => ({ ...v })), d, n, date: new Date().toLocaleDateString('ko-KR') };
    cards = cards.filter(x => x.id !== task.id); cards.push(c); cards = cards.slice(-30);
    try { localStorage.setItem('fraction-master-cards-v1', JSON.stringify(cards)); } catch { storageFailed = true; }
  }
  function renderCard(p, c, exportable = true) {
    if (!c) return;
    if (c.mixed) { renderMixedCard(p, c, exportable); return; }
    const card = add(p, 'article', '', 'master-card'); add(card, 'h3', c.title); expression(card, c);
    say(card, `① 나의 예상: ${c.baseline === 1 ? '1' : '1/2'}${c.prediction === 0 ? '과 같다' : c.prediction < 0 ? '보다 작다' : '보다 크다'}`);
    say(card, `② 내가 고른 도구: ${c.strategy.join(' · ')}`); add(card, 'h4', '③ 계산'); c.pair.forEach(v => equation(card, v, convert(v, c.d))); expression(card, { pair: c.pair.map(v => convert(v, c.d)), op: c.op }, [c.n, c.d]);
    model(card, c.n, c.d, '④ 직접 확인한 모델'); const whole = Math.floor(c.n / c.d), remainder = c.n % c.d;
    say(card, `⑤ 결과: 전체 ${whole}개와 ${c.d}분의 1 조각 ${remainder}개`);
    say(card, `⑥ 나의 설명: 두 분수를 ${c.d}분의 1이라는 같은 단위로 나타냈습니다. ${convert(c.pair[0], c.d)[0]}개${c.op === '+' ? '와' : '에서'} ${convert(c.pair[1], c.d)[0]}개를 ${c.op === '+' ? '합치면' : '빼면'} ${c.n}개이므로 ${c.d}분의 ${c.n}입니다.`);
    if (c.history.length > 1) { add(card, 'h4', '✨ 나의 수정 기록'); c.history.forEach((v, i) => { const line = add(card, 'div', '', 'master-equation'); add(line, 'span', `${i + 1}번째 답`); frac(line, [v.n, v.den]); }); }
    if (exportable) button(p, '이 설명 카드 파일 저장', () => {
      const style = 'body{font:20px sans-serif;max-width:900px;margin:30px auto;color:#17304d} .reading-fraction{display:inline-flex;flex-direction:column;text-align:center;min-width:45px;margin:0 8px}.reading-top{border-bottom:2px solid}.master-equation{display:flex;gap:12px;align-items:center;justify-content:center;margin:15px}.master-bar{display:grid;height:65px;border:2px solid;margin:10px 0}.master-cell{border-right:1px solid}.filled{background:#245bd6}.added{background:#cf7150}.master-model-title{display:flex;align-items:center;gap:12px}';
      const blob = new Blob([`<!doctype html><html lang="ko"><meta charset="utf-8"><title>나의 분수 증명</title><style>${style}</style><body>${card.outerHTML}</body></html>`], { type: 'text/html;charset=utf-8' }); const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = `분수-증명-${c.id}.html`; document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    });
  }
  function renderMixedCard(p, c, exportable) {
    const t = c.mixed, card = add(p, 'article', '', 'master-card'); add(card, 'h3', c.title); add(card, 'h4', t.prompt);
    say(card, `내가 선택한 도구: ${c.strategy.join(' · ')}`);
    if (t.kind === 'compare') { equation(card, ...t.pair, t.answer); t.pair.forEach((v, i) => model(card, ...v, i ? 'B의 양' : 'A의 양')); }
    else if (t.kind === 'mixed') { const [w, n, d] = t.answer; const row = add(card, 'div', '', 'master-equation'); frac(row, t.v); add(row, 'span', '='); add(row, 'strong', String(w)); frac(row, [n, d]); model(card, w * d + n, d, '전체와 남은 부분'); }
    else if (t.kind === 'operation') { expression(card, t, t.answer); model(card, ...t.answer, '검증한 결과'); }
    else { equation(card, t.v, t.answer); model(card, ...t.answer, '같은 양의 다른 표현'); }
    say(card, `나의 설명: ${t.reason}`); feedback(card, '★★★ 답, 모델, 이유를 확인했습니다.');
    if (exportable) button(p, '이 미션 카드 파일 저장', () => {
      const css = 'body{font:20px sans-serif;max-width:900px;margin:30px auto}.reading-fraction{display:inline-flex;flex-direction:column;text-align:center;min-width:45px;margin:8px}.reading-top{border-bottom:2px solid}.master-equation,.master-model-title{display:flex;gap:12px;align-items:center;margin:15px}.master-bar{display:grid;height:65px;border:2px solid;margin:10px 0}.master-cell{border-right:1px solid}.filled{background:#245bd6}.added{background:#cf7150}';
      const blob = new Blob([`<!doctype html><html lang="ko"><meta charset="utf-8"><title>분수 미션 증명</title><style>${css}</style><body>${card.outerHTML}</body></html>`], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob), link = document.createElement('a'); link.href = url; link.download = `분수-미션-${c.id}.html`; document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30000);
    });
  }
  function saveMixedCard(task, t, id) {
    const card = { id: `mixed-${id}`, title: '🏆 나의 분수 미션 증명', pair: task.pair || [task.v, task.v], d: 1, n: 0, strategy: [...t.strategy], mixed: { ...task, answer: t.answer } };
    cards = cards.filter(c => c.id !== card.id); cards.push(card); cards = cards.slice(-30);
    try { localStorage.setItem('fraction-master-cards-v1', JSON.stringify(cards)); } catch { storageFailed = true; }
  }
  function journey(p, task, s, castleMode = false) {
    const names = ['예상의 방', '전략의 방', '계산의 방', '증명의 방', '설명의 방']; s.phase ??= 0;
    add(p, 'h3', castleMode ? `${s.phase + 1}번 방 — ${names[s.phase]}` : ['예상', '전략', '내 풀이', '모델 검증과 수정', '이유 설명'][s.phase]);
    if (s.phase === 0) prediction(p, task, s);
    if (s.phase === 1) strategy(p, s);
    if (s.phase === 2) draftForm(p, task, s);
    if (s.phase === 3) proof(p, task, s);
    if (s.phase === 4) finishExplanation(p, task, s);
    const ready = [s.prediction !== undefined, s.strategy.length > 0, !!s.draft, s.verified][s.phase];
    if (ready && s.phase < 4) button(p, s.phase === 2 ? '🔍 내 답 증명하기' : castleMode ? '다음 방으로' : '다음 과정으로', () => { s.phase++; render(); });
    if (s.explained && castleMode) { add(p, 'h3', '🏆 분수 마스터'); for (const text of ['예상할 수 있어요 ✓', '전략을 선택할 수 있어요 ✓', '계산할 수 있어요 ✓', '모델로 증명할 수 있어요 ✓', '이유를 설명할 수 있어요 ✓']) say(p, text); }
  }
  function robot(p, s) {
    expression(p, { pair: [[1, 2], [1, 3]], op: '+' }, [5, 6]); say(p, '🤖 로봇: 1+1=2이고 2+3=5니까 계산해서 5/6이야!');
    const m = feedback(p); for (const [label, key, correct] of [['답', 'answer', true], ['설명', 'reason', false]]) { say(p, `${label}은 맞을까요?`); const row = add(p, 'div', '', 'master-actions'); for (const [text, flag] of [['맞아요', true], ['틀렸어요', false]]) { const b = button(row, `${label}: ${text}`, () => { s[key] = flag; render(); }); b.setAttribute('aria-pressed', String(s[key] === flag)); } }
    button(p, '두 판단 확인', () => { if (s.answer === true && s.reason === false) { s.checked = true; render(); } else m.textContent = '답이 맞는지와 설명의 과정이 옳은지는 따로 살펴보세요.'; });
    if (s.checked) { model(p, 3, 6, '이분의 일'); model(p, 2, 6, '삼분의 일'); button(p, '육분의 일로 바꾸면 3조각과 2조각이 되어 모두 5조각이에요', () => { s.fixed = true; render(); }); if (s.fixed) feedback(p, '답이 맞아도 이유가 옳아야 수학적으로 증명한 것이에요!'); }
  }
  function mystery(p, s) {
    s.mode ??= 0; s.tasks ??= [{}, {}, {}]; const tabs = add(p, 'div', '', 'master-actions'); ['빈 분자', '사라진 분수', '전체 1 만들기'].forEach((text, i) => button(tabs, text, () => { s.mode = i; render(); })); const t = s.tasks[s.mode];
    if (s.mode === 0) { expression(p, { pair: [['□', 6], [2, 6]], op: '+' }, [5, 6]); form(p, ['빈칸의 수'], '내 답 검증', ([n], m) => { t.attempt = n; if (n !== 3) { t.show = true; render(); return; } t.done = true; render(); }); if (t.show || t.done) { model(p, 5, 6, '결과의 5조각'); model(p, 2, 6, '이미 있는 2조각'); } if (t.done) feedback(p, '남은 3조각을 찾아 식을 완성했어요!'); }
    if (s.mode === 1) { say(p, '이분의 일에 어떤 분수를 더하면 육분의 오가 될까요?'); equation(p, [1, 2], [5, 6], '+ □ ='); form(p, ['빈 분수의 분자', '빈 분수의 분모'], '내 분수 검증', ([n, d], m) => { if (d < 1 || d > 60 || n > 60) { m.textContent = '분모는 1~60 범위로 적어 주세요.'; return; } t.attempt = [n, d]; t.done = equal([n, d], [1, 3]); t.show = true; render(); }); if (t.show) { model(p, 3, 6, '이미 있는 양'); model(p, 5, 6, '목표 양'); model(p, ...t.attempt, '내가 넣은 분수'); feedback(p, t.done ? '같은 크기의 다른 표현도 가능해요. 2/6과 1/3은 모두 맞아요!' : '목표와 이미 있는 양 사이에 몇 조각이 필요한지 확인해 보세요.'); } }
    if (s.mode === 2) { say(p, '더하면 전체 1이 되는 두 분수를 여러 가지로 만들어 보세요.'); form(p, ['첫 분자', '첫 분모', '둘째 분자', '둘째 분모'], '두 분수 합쳐 검증', ([a, d, b, e], m) => { if (d < 2 || e < 2 || d > 12 || e > 12 || a <= 0 || b <= 0 || a >= d || b >= e) { m.textContent = '분모 2~12인 0보다 크고 1보다 작은 분수 두 개를 만들어 보세요.'; return; } t.attempt = [[a, d], [b, e]]; if (Math.abs(a / d + b / e - 1) < 1e-10) { t.records ??= []; if (!t.records.some(v => JSON.stringify(v) === JSON.stringify(t.attempt))) t.records.push(t.attempt); } render(); }); if (t.attempt) { t.attempt.forEach((v, i) => model(p, ...v, i ? '두 번째 양' : '첫 번째 양')); } if (t.records) for (const pair of t.records) expression(p, { pair, op: '+' }, [1, 1]); }
  }
  function debate(p, s) {
    const pair = [[2, 3], [3, 5]]; expression(p, { pair, op: '+' }); say(p, '민수: 5/8! 분자와 분모를 각각 더했어.'); say(p, '지우: 19/15! 15로 통분했어.'); say(p, '하늘: 답은 1보다 작을 거야.');
    button(p, '공통 단위로 주장 검증하기', () => { s.inspect = true; render(); }); if (s.inspect) { if (!s.d) FractionTools.denominatorPicker(p, pair, s, render, d => { s.d = d; render(); }, 60); else { pair.forEach((v, i) => model(p, ...convert(v, s.d), i ? 'B 검증' : 'A 검증')); button(p, '조각을 합쳐 1과 비교', () => { s.shown = true; render(); }); if (s.shown) model(p, total({ pair, op: '+' }, s.d), s.d, '주장 검증 결과'); } }
    say(p, '생각에 오류가 있는 사람을 모두 고르세요.'); s.chosen ??= new Set(); const choices = add(p, 'div', '', 'master-actions'); ['민수', '지우', '하늘'].forEach((name, i) => { const b = button(choices, name, () => { s.chosen.has(i) ? s.chosen.delete(i) : s.chosen.add(i); s.done = false; render(); }); b.setAttribute('aria-pressed', String(s.chosen.has(i))); }); const m = feedback(p);
    button(p, '주장 판정', () => { if (!s.shown) { m.textContent = '먼저 공통 단위와 기준 1로 주장을 검증해 보세요.'; return; } if (s.chosen.size !== 2 || !s.chosen.has(0) || !s.chosen.has(2)) { m.textContent = '단위가 같은지, 합친 양이 전체 1을 넘는지 각각 살펴보세요.'; return; } s.done = true; render(); });
    if (s.done) feedback(p, '민수는 서로 다른 단위를 맞추지 않았고, 하늘의 예상은 모델의 양과 달라요. 지우의 풀이가 확인되었어요.');
  }
  const mixedTasks = [
    { prompt: '3/4와 5/8 중 어느 쪽이 클까요?', kind: 'compare', pair: [[3, 4], [5, 8]], reason: '조각 크기를 같게 나타내면 색칠된 조각 수를 비교할 수 있어요' },
    { prompt: '6/8과 같은 크기를 다른 분수로 나타내세요.', kind: 'equal', v: [6, 8], reason: '전체와 색칠한 크기를 유지하며 조각을 나누거나 묶었어요' },
    { prompt: '11/4를 전체 몇 개와 남은 부분으로 나타내세요.', kind: 'mixed', v: [11, 4], reason: '4조각씩 전체를 묶고 남은 조각을 확인했어요' },
    { prompt: '4/6을 가장 간단한 분수로 나타내세요.', kind: 'simple', v: [4, 6], reason: '같은 수의 조각끼리 묶어도 전체와 색칠한 양은 같아요' },
    { prompt: '2/5 + 1/5 = ?', kind: 'operation', pair: [[2, 5], [1, 5]], op: '+', reason: '같은 단위 조각의 개수만 더했어요' },
    { prompt: '2/3 + 1/4 = ?', kind: 'operation', pair: [[2, 3], [1, 4]], op: '+', reason: '공통 단위로 바꾼 뒤 같은 조각의 개수를 더했어요' },
    { prompt: '5/6 − 1/4 = ?', kind: 'operation', pair: [[5, 6], [1, 4]], op: '−', reason: '공통 단위로 바꾼 뒤 같은 조각의 개수를 뺐어요' },
    { prompt: '로봇: 3/4 + 1/2 = 4/6. 올바른 결과로 고치세요.', kind: 'operation', pair: [[3, 4], [1, 2]], op: '+', reason: '분자와 분모를 각각 더하면 안 되고 단위부터 맞춰야 해요' }
  ];
  function mixedMissions(p, s) {
    s.order ??= mixedTasks.map((_, i) => i).sort(() => Math.random() - .5); s.index ??= 0; s.tasks ??= mixedTasks.map(() => ({}));
    if (s.index === mixedTasks.length) { feedback(p, '🏆 서로 다른 여덟 문제에서 전략, 답, 근거를 연결했어요!'); button(p, '마스터 성으로', () => { step = 11; render(); }); return; }
    const task = mixedTasks[s.order[s.index]], t = s.tasks[s.order[s.index]]; t.strategy ??= []; say(p, `미션 ${s.index + 1} / 8`); add(p, 'h3', task.prompt); strategy(p, t);
    if (!t.strategy.length) return;
    const labels = task.kind === 'compare' ? [] : task.kind === 'mixed' ? ['전체 수', '남은 분자', '남은 분모'] : ['결과 분자', '결과 분모'];
    if (task.kind === 'compare') { const choices = add(p, 'div', '', 'master-actions'); for (const sign of ['<', '>', '=']) { const b = button(choices, sign, () => { t.answer = sign; t.checked = false; t.done = false; render(); }); b.setAttribute('aria-pressed', String(t.answer === sign)); } }
    else form(p, labels, '먼저 내 답 기록', (v, m) => { const d = v[v.length - 1]; if (d < 1 || d > 60 || v.some(n => n > 120)) { m.textContent = '분모는 1~60, 수는 0~120 범위로 적어 주세요.'; return; } t.answer = v; t.checked = false; t.done = false; render(); });
    if (t.answer === undefined) return;
    button(p, '내 답을 모델로 검증', () => { t.checked = true; render(); });
    if (!t.checked) return;
    let correct = false;
    if (task.kind === 'compare') { task.pair.forEach((v, i) => model(p, ...v, i ? 'B' : 'A')); overlay(p, ...task.pair); correct = t.answer === '>'; }
    else if (task.kind === 'mixed') { model(p, ...task.v, '원래 양'); const [w, n, d] = t.answer; model(p, w * d + n, d, '내 답'); correct = w === 2 && n === 3 && d === 4; }
    else if (task.kind === 'equal' || task.kind === 'simple') { model(p, ...task.v, '원래 양'); model(p, ...t.answer, '내 답'); overlay(p, task.v, t.answer); correct = equal(task.v, t.answer) && (task.kind === 'equal' ? t.answer[0] !== 6 || t.answer[1] !== 8 : gcd(...t.answer) === 1); }
    else { const d = common(task.pair), n = total(task, d); task.pair.forEach((v, i) => model(p, ...convert(v, d), i ? 'B의 공통 단위' : 'A의 공통 단위')); model(p, n, d, '단위 조각을 계산한 양'); model(p, ...t.answer, '내 답'); correct = equal(t.answer, [n, d]); }
    if (!correct) { feedback(p, '원래 양과 내 답의 모델을 비교해 수정해 보세요. 문제에서 요청한 표현 방법도 확인하세요.'); return; }
    say(p, '모델과 답이 맞아요. 왜 이렇게 해결했나요?'); const m = feedback(p); button(p, task.reason, () => { t.done = true; saveMixedCard(task, t, s.order[s.index]); render(); }); button(p, '분자와 분모의 숫자만 각각 계산했어요', () => { m.textContent = '전체와 단위 조각의 크기를 어떻게 다뤘는지 설명해 보세요.'; });
    if (t.done) { feedback(p, '★★★ 답과 모델, 이유를 연결했어요!'); button(p, '다음 미션', () => { s.index++; render(); }); }
  }
  function render() {
    host.replaceChildren(); nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(step === i))); add(host, 'h2', `12-${step + 1} ${titles[step]}`);
    const s = states[step], main = sessions.first;
    if (step === 0) { prediction(host, primary, main); if (main.prediction !== undefined) button(host, '내 전략 고르기', () => { step = 1; render(); }); }
    if (step === 1) { if (main.prediction === undefined) { say(host, '먼저 예상부터 남겨 보세요.'); button(host, '예상하러 가기', () => { step = 0; render(); }); } else { strategy(host, main); if (main.strategy.length) button(host, '모델 없이 계산하기', () => { step = 2; render(); }); } }
    if (step === 2) { if (!main.strategy.length || main.prediction === undefined) { say(host, '예상과 전략을 먼저 남겨 보세요.'); button(host, '처음 예상으로', () => { step = 0; render(); }); } else { draftForm(host, primary, main); if (main.draft) button(host, '🔍 내 답 증명하기', () => { step = 3; render(); }); } }
    if (step === 3) { if (!main.draft) { say(host, '계산 결과를 먼저 기록해 보세요.'); button(host, '내 풀이로', () => { step = 2; render(); }); } else { proof(host, primary, main); finishExplanation(host, primary, main); } }
    if (step === 4) journey(host, correction, sessions.correction);
    if (step === 5) robot(host, s);
    if (step === 6) mystery(host, s);
    if (step === 7) debate(host, s);
    if (step === 8) journey(host, independent, sessions.independent);
    if (step === 9) { say(host, '완성한 증명 카드는 이 브라우저에 저장됩니다. 파일로 저장해 가져갈 수도 있어요.'); if (storageFailed) feedback(host, '브라우저 저장을 사용할 수 없어 현재 화면에서만 보관 중입니다. 카드 파일 저장을 이용하세요.'); if (!cards.length) { say(host, '아직 완성한 카드가 없어요. 예상부터 모델 검증과 설명까지 마쳐 보세요.'); button(host, '첫 증명 계속하기', () => { step = 3; render(); }); } cards.forEach(c => renderCard(host, c)); }
    if (step === 10) mixedMissions(host, s);
    if (step === 11) journey(host, castle, sessions.castle, true);
    const footer = add(host, 'div', '', 'reading-footer'); if (step) button(footer, '← 이전 활동', () => { step--; render(); }); if (step < 11) button(footer, '다음 활동 →', () => { step++; render(); });
  }
  titles.forEach((title, i) => { const b = button(nav, i === 11 ? '마스터 성' : `12-${i + 1}`, () => { step = i; render(); }); b.title = title; }); render();
})();


