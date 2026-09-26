// 11단계: 다른 단위 발견 → 같은 단위 만들기 → 연산 → 결과 해석.
(() => {
  const host = document.querySelector('#operations-content'), nav = document.querySelector('#operations-steps');
  const titles = ['왜 바로 합쳐지지 않을까?', '공통 단위 변환기', '이제 조각을 합쳐요', '왜 2/5가 아닐까?', '공통분모를 직접 찾아요', '같은 조각으로 빼기', '계산한 뒤 다시 묶기', '1을 넘는 결과', '보너스: 대분수 연구소', '통분이 필요할까?', '풀이 과정 수리공', '혼자 해결하는 다섯 LEVEL', '최종 보스'];
  const states = titles.map(() => ({})); let step = 0;
  const add = (p, tag, text = '', cls = '') => { const e = document.createElement(tag); e.textContent = text; e.className = cls; p.append(e); return e; };
  function button(p, text, fn) { const b = add(p, 'button', text); b.type = 'button'; b.onclick = fn; return b; }
  const say = (p, text) => add(p, 'p', text, 'ops-instruction');
  function message(p, text = '') { const m = add(p, 'p', text, 'ops-feedback'); m.setAttribute('role', 'status'); return m; }
  function frac(p, v) { const f = add(p, 'span', '', 'reading-fraction'); f.setAttribute('role', 'img'); f.setAttribute('aria-label', `${v[1]}분의 ${v[0]}`); for (const [cls, x] of [['reading-top', v[0]], ['reading-bottom', v[1]]]) { const part = add(f, 'span', String(x), cls); part.setAttribute('aria-hidden', 'true'); } return f; }
  function equation(p, a, b, sign = '=') { const row = add(p, 'div', '', 'ops-equation'); frac(row, a); add(row, 'span', sign); frac(row, b); return row; }
  function expression(p, pair, op = '+', result) { const row = equation(p, ...pair, op); if (result) { add(row, 'span', '='); frac(row, result); } return row; }
  const convert = (v, d) => [v[0] * (d / v[1]), d];
  const valid = (pair, d) => Number.isInteger(d) && d >= 2 && d <= 60 && pair.every(v => d % v[1] === 0);
  function numeric(p, label, minimum = 0) { const wrapper = add(p, 'label', label), i = add(wrapper, 'input'); i.type = 'number'; i.min = String(minimum); i.max = '180'; i.step = '1'; i.required = true; i.inputMode = 'numeric'; i.setAttribute('aria-label', label); return i; }
  function askNumbers(p, fields, submitText, check, success) {
    const form = add(p, 'form', '', 'ops-form'), inputs = fields.map(label => numeric(form, label)); const submit = add(form, 'button', submitText); submit.type = 'submit'; const m = message(p);
    form.onsubmit = e => { e.preventDefault(); const values = inputs.map(i => Number(i.value)); if (!values.every(Number.isInteger) || !check(values)) { m.textContent = '같은 크기의 조각으로 바꾼 식과 조각 수를 다시 확인해 보세요.'; return; } success(values); render(); };
  }
  function model(p, v, label, { first = v[0], selected, click } = {}) {
    const row = add(p, 'div', '', 'ops-model'); const head = add(row, 'div', '', 'ops-model-title'); add(head, 'strong', label); frac(head, v);
    for (let whole = 0; whole < Math.max(1, Math.ceil(v[0] / v[1])); whole++) {
      if (v[0] > v[1]) add(row, 'small', `${whole + 1}번째 전체`);
      const track = add(row, 'div', '', 'ops-bar'); track.style.gridTemplateColumns = `repeat(${v[1]},minmax(0,1fr))`; track.setAttribute('role', 'group'); track.setAttribute('aria-label', `${label} ${whole + 1}번째 전체`);
      for (let i = 0; i < v[1]; i++) {
        const index = whole * v[1] + i, filled = selected ? selected.has(index) : index < v[0];
        const cell = add(track, click ? 'button' : 'span', '', `ops-cell${filled ? index < first ? ' filled' : ' added' : ''}`);
        if (click) { cell.type = 'button'; cell.setAttribute('aria-label', `${label} ${index + 1}번째 조각`); cell.onclick = () => click(index); }
      }
    }
    return row;
  }
  function drag(token, target, apply) {
    let start, moved = false, suppress = false; token.classList.add('ops-draggable');
    token.addEventListener('pointerdown', e => { start = [e.clientX, e.clientY]; moved = false; suppress = false; token.setPointerCapture(e.pointerId); });
    token.addEventListener('pointermove', e => { if (!start) return; const x = e.clientX - start[0], y = e.clientY - start[1]; moved ||= Math.abs(x) + Math.abs(y) > 8; if (moved) { token.style.transform = `translate(${x}px,${y}px)`; token.classList.add('moving'); } });
    const clear = () => { start = null; token.style.transform = ''; token.classList.remove('moving'); };
    token.addEventListener('pointerup', e => { if (!start) return; const r = target.getBoundingClientRect(), hit = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; suppress = moved; clear(); if (token.hasPointerCapture(e.pointerId)) token.releasePointerCapture(e.pointerId); if (moved && hit) apply(); });
    token.addEventListener('pointercancel', () => { suppress = true; clear(); });
    token.addEventListener('click', () => { if (suppress) { suppress = false; return; } apply(); });
  }
  function rejection(p, pair, op, s, proceed) {
    expression(p, pair, op); model(p, pair[0], 'A의 전체'); model(p, pair[1], 'B의 전체');
    say(p, op === '+' ? '색칠 조각을 같은 칸으로 된 막대에 넣어 보세요. 조각을 끌거나 눌러 옮겨요.' : '빼려는 조각을 처음 막대의 칸에 맞춰 보세요.');
    const tray = add(p, 'div', '', 'ops-mismatch-pool'), drop = add(p, 'div', '', 'ops-drop'); drop.setAttribute('role', 'group'); drop.setAttribute('aria-label', '같은 칸 막대');
    say(drop, '같은 크기의 칸으로 계산하는 자리'); const rejected = () => { s.tried = true; render(); };
    const values = op === '+' ? pair : [pair[1]];
    values.forEach((v, i) => { const track = add(tray, 'div', '', 'ops-unit-reference'), t = add(track, 'button', '', 'ops-loose'); t.type = 'button'; t.style.width = `${100 / v[1]}%`; t.setAttribute('aria-label', `${v[1]}분의 1 조각 맞춰 보기`); frac(t, [1, v[1]]); drag(t, drop, rejected); });
    if (s.tried) {
      message(p, '조각의 크기가 달라요! 같은 단위 조각의 개수로 바로 계산하려면 먼저 크기를 맞춰야 해요.');
      const units = add(p, 'div', '', 'ops-equation'); frac(units, [1, pair[0][1]]); add(units, 'span', '≠'); frac(units, [1, pair[1][1]]);
      button(p, '같은 크기의 조각으로 바꾸기', proceed);
    }
  }
  function transformer(p, pair, s, onReady) {
    s.values ??= pair.map(v => [...v]); const m = message(p);
    s.values.forEach((v, i) => {
      model(p, v, i ? 'B 막대' : 'A 막대', { click: () => { m.replaceChildren(); add(m, 'span', `${i ? 'B' : 'A'}의 한 조각: `); frac(m, [1, v[1]]); } });
      const controls = add(p, 'div', '', 'ops-actions');
      for (const factor of [2, 3]) button(controls, `${i ? 'B' : 'A'} 각 칸을 ${factor}개로 나누기`, () => { if (v[1] * factor > 60) { m.textContent = '60칸까지 탐구해요. 처음 막대로 돌아가 다시 나눠 보세요.'; return; } s.values[i] = v.map(n => n * factor); render(); });
      equation(p, pair[i], v);
    });
    button(p, '나누기 처음부터', () => { s.values = pair.map(v => [...v]); render(); });
    if (s.values[0][1] === s.values[1][1]) {
      const d = s.values[0][1]; message(p, '🎉 이제 조각의 크기가 같아졌어요!'); const row = add(p, 'div', '', 'ops-equation'); add(row, 'strong', '공통 단위 ='); frac(row, [1, d]);
      button(p, '이 조각으로 계산하기', () => onReady(d));
    }
  }
  function chooseUnit(p, pair, s) {
    expression(p, pair, s.op || '+');
    FractionTools.denominatorPicker(p, pair, s, render, d => { s.d = d; render(); }, 60);
  }
  function unitReason(p, d, s) {
    say(p, '왜 이제 계산할 수 있을까요?'); const m = message(p);
    button(p, `두 분수의 조각이 모두 ${d}분의 1로 같아졌기 때문이에요`, () => { s.reason = true; render(); });
    button(p, '분모가 큰 수로 바뀌었기 때문이에요', () => { m.textContent = '숫자가 커진 것보다 한 조각의 크기가 서로 같아졌는지 생각해 보세요.'; });
    if (s.reason) message(p, '맞아요! 같은 크기의 조각이 몇 개인지 더하거나 빼는 거예요.');
  }
  function pool(p, d) { const grid = add(p, 'div', '', 'ops-token-grid'); grid.style.gridTemplateColumns = `repeat(${d},minmax(0,1fr))`; return grid; }
  function unitToken(p, d, name, orange = false) { const b = add(p, 'button', '', `ops-token${orange ? ' orange' : ''}`); b.type = 'button'; b.setAttribute('aria-label', name); frac(b, [1, d]); return b; }
  // 같은 분모를 확인한 뒤에만 단위 조각의 이동을 허용합니다.
  function manipulate(p, pair, op, s) {
    const convertedPair = pair.map(v => convert(v, s.d)), a = convertedPair[0][0], b = convertedPair[1][0];
    pair.forEach((v, i) => equation(p, v, convertedPair[i]));
    s.moved ??= new Set(); const source = add(p, 'div'), target = add(p, 'div', '', 'ops-drop'); target.setAttribute('role', 'group'); target.setAttribute('aria-label', op === '+' ? '조각 합치는 막대' : '꺼낸 조각 자리');
    add(target, 'strong', op === '+' ? '조각을 합치는 자리' : '꺼낸 조각'); const m = message(p);
    const resetResult = () => { s.reason = false; s.grouped = false; s.reduced = null; };
    const move = id => { if (op === '−' && s.moved.size >= b) { m.textContent = `이번에는 ${b}조각만 꺼내요. 남은 조각을 세어 보세요.`; return; } s.moved.add(id); resetResult(); render(); };
    if (op === '+') {
      for (const [label, number, offset] of [['A', a, 0], ['B', b, a]]) {
        add(source, 'h3', `${label}의 같은 크기 조각`); const grid = pool(source, s.d);
        for (let i = 0; i < number; i++) { const id = offset + i; if (s.moved.has(id)) continue; const t = unitToken(grid, s.d, `${label} 조각 ${i + 1} 합치기`, label === 'B'); drag(t, target, () => move(id)); }
        const next = Array.from({ length: number }, (_, i) => offset + i).find(id => !s.moved.has(id));
        const control = button(source, `${label} 조각 하나 옮기기`, () => { if (next !== undefined) move(next); }); control.disabled = next === undefined;
      }
      model(target, [s.moved.size, s.d], '모은 조각', { first: [...s.moved].filter(id => id < a).length });
    } else {
      say(source, `${s.d}분의 1 조각 ${b}개를 꺼내세요.`); const grid = pool(source, s.d);
      for (let i = 0; i < s.d; i++) { if (i >= a || s.moved.has(i)) { add(grid, 'span', '', 'ops-empty'); continue; } const t = unitToken(grid, s.d, `${i + 1}번째 조각 꺼내기`); drag(t, target, () => move(i)); }
      const next = Array.from({ length: a }, (_, i) => i).find(i => !s.moved.has(i));
      button(source, '조각 하나 꺼내기', () => { if (next !== undefined) move(next); });
      model(target, [s.moved.size, s.d], '꺼낸 양');
    }
    if (s.moved.size) button(target, '마지막 조각 되돌리기', () => { const id = [...s.moved].pop(); s.moved.delete(id); resetResult(); render(); });
    const done = s.moved.size === (op === '+' ? a + b : b);
    if (done) {
      const result = op === '+' ? a + b : a - b;
      model(p, [result, s.d], op === '+' ? '합친 결과' : '남은 결과', { first: op === '+' ? a : result });
      expression(p, pair, op); add(p, 'div', '↓', 'ops-arrow'); expression(p, convertedPair, op, [result, s.d]);
      unitReason(p, s.d, s); return result;
    }
    return null;
  }
  function interpret(p, n, d, s, { reduce = false, whole = 0 } = {}) {
    if (reduce) {
      const v = s.reduced || [n, d]; say(p, '더 간단하게 나타낼 수 있을까요? 같은 수의 조각끼리 묶어 보세요.'); model(p, v, '묶을 결과'); const m = message(p);
      for (const k of [2, 3]) button(p, `${k}칸씩 다시 묶기`, () => { if (v[0] % k || v[1] % k || v[1] / k < 2) { m.textContent = '색칠 경계와 전체가 모두 맞도록 묶을 수 있는 수를 골라 보세요.'; return; } s.reduced = v.map(x => x / k); render(); });
      if (s.reduced) { equation(p, [n, d], s.reduced); message(p, '전체와 색칠된 양은 그대로이고 조각 수만 줄었어요.'); }
    }
    if (n >= d || whole) {
      button(p, '🧩 전체로 묶기', () => { s.grouped = true; render(); });
      if (s.grouped) {
        const total = n + whole * d; model(p, [total, d], '전체로 묶은 양'); const row = add(p, 'div', '', 'ops-equation'); frac(row, [total, d]); add(row, 'span', '='); add(row, 'strong', String(Math.floor(total / d))); if (total % d) frac(row, [total % d, d]);
        say(p, `완성된 전체는 ${Math.floor(total / d)}개이고 ${d}분의 1 조각 ${total % d}개가 남아요.`);
      }
    }
  }
  function operation(p, pair, op, s, opts = {}) {
    s.op = op;
    if (opts.whole) { const row = add(p, 'div', '', 'ops-equation'); add(row, 'strong', '1'); frac(row, pair[0]); add(row, 'span', '+'); frac(row, pair[1]); say(p, '보너스 연구소: 이미 있는 전체 1은 두고 분수 부분부터 계산해요.'); model(p, [1, 1], '기존 전체 1'); }
    if (!s.d) { chooseUnit(p, pair, s); return; }
    const result = manipulate(p, pair, op, s);
    if (result !== null) interpret(p, result, s.d, s, opts);
  }
  function symbolic(p, pair, op, s, { independent = false } = {}) {
    expression(p, pair, op);
    if (!s.d) {
      if (independent) askNumbers(p, ['내 공통분모'], '공통분모 확인', ([d]) => valid(pair, d), ([d]) => { s.d = d; });
      else { say(p, '공통 단위를 직접 찾아보세요.'); FractionTools.denominatorPicker(p, pair, s, render, d => { s.d = d; render(); }, 60); }
      return false;
    }
    const unit = add(p, 'div', '', 'ops-equation'); add(unit, 'strong', '공통 단위 ='); frac(unit, [1, s.d]);
    if (!s.converted) {
      pair.forEach(v => equation(p, v, ['□', s.d]));
      askNumbers(p, ['A의 새 분자', 'B의 새 분자'], '통분 확인', ([a, b]) => a === convert(pair[0], s.d)[0] && b === convert(pair[1], s.d)[0], () => { s.converted = true; }); return false;
    }
    const values = pair.map(v => convert(v, s.d)); pair.forEach((v, i) => equation(p, v, values[i]));
    const n = op === '+' ? values[0][0] + values[1][0] : values[0][0] - values[1][0];
    if (!s.calculated) { expression(p, values, op); askNumbers(p, ['계산 결과의 분자', '계산 결과의 분모'], '계산 확인', ([a, b]) => a === n && b === s.d, () => { s.calculated = true; }); return false; }
    expression(p, values, op, [n, s.d]);
    button(p, s.show ? '검증 막대 숨기기' : '막대로 검증', () => { s.show = !s.show; render(); }); if (s.show) model(p, [n, s.d], '모델 검증');
    return n;
  }
  function explain(p, pair, s, boss = false) {
    const d = s.d, a = convert(pair[0], d)[0], b = convert(pair[1], d)[0], n = a + b;
    say(p, '문장을 완성하세요. 단위가 달라서 공통 단위로 바꾼 뒤 같은 조각의 개수를 합쳤어요.');
    askNumbers(p, boss ? ['공통 단위의 분모', '합친 조각 수', '완성된 전체 수', '남은 조각 수'] : ['설명의 공통분모', 'A의 조각 수', 'B의 조각 수', '합친 조각 수'], '설명 완성', values => boss ? values[0] === d && values[1] === n && values[2] === Math.floor(n / d) && values[3] === n % d : values[0] === d && values[1] === a && values[2] === b && values[3] === n, () => { s.explained = true; });
    if (s.explained) {
      message(p, boss ? '🏆 분수 연산 마스터! 모델, 식, 결과, 이유를 연결했어요.' : '같은 크기의 조각으로 바꾸어 계산한 이유를 설명했어요!');
      say(p, `두 분수의 단위가 달라서 ${d}분의 1이라는 공통 단위로 바꾸었습니다. ${a}개와 ${b}개를 합치면 ${d}분의 ${n}입니다.${boss ? ` 이것은 전체 ${Math.floor(n / d)}개와 ${d}분의 ${n % d}입니다.` : ''}`);
      expression(p, pair, '+', [n, d]); model(p, [n, d], '설명한 결과');
      if (boss) button(p, '12단계에서 스스로 증명하기', () => document.querySelector('[data-panel="master"]').click());
    }
  }
  function needUnit(p, s) {
    const tasks = [[[[2, 7], [3, 7]], '+'], [[[1, 2], [1, 3]], '+'], [[[3, 8], [1, 8]], '−'], [[[3, 4], [1, 2]], '−']];
    s.index ??= 0; s.tasks ??= tasks.map(() => ({})); const t = s.tasks[s.index], [pair, op] = tasks[s.index];
    say(p, `문제 ${s.index + 1} / 4`); expression(p, pair, op); say(p, '통분이 필요할까요?'); const m = message(p), different = pair[0][1] !== pair[1][1];
    for (const [label, value] of [['네, 필요해요', true], ['아니요, 이미 같아요', false]]) button(p, label, () => { if (value !== different) { m.textContent = '두 분수의 한 조각이 같은 크기인지 확인해 보세요.'; return; } t.answered = true; render(); });
    if (t.answered) {
      pair.forEach((v, i) => model(p, [1, v[1]], `${i ? 'B' : 'A'}의 단위 조각`));
      button(p, different ? '두 단위 조각의 크기가 다르기 때문이에요' : '이미 같은 단위 조각이기 때문이에요', () => { t.reason = true; render(); });
      if (t.reason) { message(p, different ? '필요할 때 공통 단위를 만들어요.' : '이미 같은 단위라 바로 조각 수를 계산할 수 있어요.'); button(p, s.index === 3 ? '판단 미션 완료' : '다음 문제', () => { if (s.index === 3) { s.complete = true; render(); } else { s.index++; render(); } }); }
    }
    if (s.complete) message(p, '🎉 네 문제 모두 단위 크기로 판단했어요!');
  }
  function repair(p, s) {
    s.index ??= 0; s.tasks ??= [{}, {}, {}]; const t = s.tasks[s.index], pair = [[2, 3], [1, 4]];
    const tabs = add(p, 'div', '', 'ops-actions'); for (let i = 0; i < 3; i++) button(tabs, `로봇 ${i + 1}`, () => { s.index = i; render(); });
    expression(p, pair); say(p, '풀이에서 처음 잘못된 줄을 선택하세요. 맞는 풀이일 수도 있어요.');
    const m = message(p);
    function line(label, draw, correct) { const b = button(p, '', () => { if (correct) { t.found = true; render(); } else m.textContent = '단위 크기를 맞춘 과정과 마지막 계산을 나누어 살펴보세요.'; }); b.className = 'ops-proof-line'; b.setAttribute('aria-label', label); draw(b); }
    if (s.index === 0) line('1번째 풀이 줄', p => frac(p, [3, 7]), true);
    else { line('1번째 풀이 줄', p => expression(p, [[8, 12], [3, 12]]), false); line('2번째 풀이 줄', p => frac(p, s.index === 1 ? [11, 24] : [11, 12]), s.index === 1); }
    button(p, '모두 맞는 풀이예요', () => { if (s.index === 2) { t.found = true; render(); } else m.textContent = '조각의 크기를 맞추었는지, 계산 후에도 유지했는지 확인해 보세요.'; });
    if (t.found) {
      if (s.index < 2 && !t.fixed) askNumbers(p, ['수리한 답의 분자', '수리한 답의 분모'], '풀이 수리 확인', ([n, d]) => n === 11 && d === 12, () => { t.fixed = true; });
      if (s.index === 2 || t.fixed) {
        const correct = ['처음부터 분자와 분모를 각각 더해서 단위가 맞지 않았어요', '통분은 맞았지만 마지막에 분모를 더해 조각 크기가 바뀌었어요', '같은 크기의 조각으로 바꾼 뒤 개수만 더했어요'][s.index];
        button(p, correct, () => { t.reason = true; render(); }); button(p, '숫자가 크면 무조건 맞아요', () => { m.textContent = '숫자 크기보다 단위와 풀이 과정을 확인해 보세요.'; });
        if (t.reason) { expression(p, [[8, 12], [3, 12]], '+', [11, 12]); message(p, '풀이의 어느 부분에서 단위가 바뀌는지 확인했어요!'); }
      }
    }
  }
  function levels(p, s) {
    s.level ??= 0; s.tasks ??= Array.from({ length: 5 }, () => ({})); const tabs = add(p, 'div', '', 'ops-actions');
    for (let i = 0; i < 5; i++) { const b = button(tabs, `LEVEL ${i + 1}`, () => { s.level = i; render(); }); b.setAttribute('aria-pressed', String(i === s.level)); }
    const t = s.tasks[s.level], pair = [[2, 3], [1, 4]];
    if (s.level === 0) { if (!t.d) transformer(p, [[1, 2], [1, 3]], t, d => { t.d = d; render(); }); else operation(p, [[1, 2], [1, 3]], '+', t); }
    if (s.level === 1) {
      if (!t.d) { expression(p, pair); say(p, '공통분모를 선택하면 막대가 변해요.'); const m = message(p); for (const d of [6, 8, 12, 24]) button(p, `${d}칸으로`, () => { if (!valid(pair, d)) { m.textContent = '두 분수의 원래 조각을 모두 똑같이 다시 나눌 수 있는 수를 찾아보세요.'; return; } t.d = d; render(); }); }
      else operation(p, pair, '+', t);
    }
    if (s.level === 2) { t.d ??= 12; symbolic(p, pair, '+', t); }
    if (s.level === 3) symbolic(p, pair, '+', t, { independent: true });
    if (s.level === 4) { t.d ??= 12; expression(p, pair); say(p, '다음 모델에서 사용한 공통 단위와 조각 수를 문장으로 설명하세요.'); model(p, [8, 12], 'A를 바꾼 막대'); model(p, [3, 12], 'B를 바꾼 막대'); explain(p, pair, t); }
  }
  function boss(p, s) {
    const pair = [[2, 3], [3, 5]]; expression(p, pair); const m = message(p);
    if (!s.need) {
      say(p, '단위 조각의 개수를 바로 합칠 수 있나요?');
      button(p, '네, 바로 합쳐요', () => { m.textContent = '한 조각의 크기가 같은지 먼저 확인해 보세요.'; });
      button(p, '아니요, 먼저 크기를 맞춰야 해요', () => { s.need = true; render(); }); return;
    }
    if (!s.why) {
      say(p, '왜 먼저 크기를 맞춰야 할까요?'); button(p, '삼분의 일과 오분의 일의 크기가 달라요', () => { s.why = true; render(); }); button(p, '분자가 크기 때문이에요', () => { m.textContent = '한 조각의 크기를 설명해 보세요.'; }); return;
    }
    const n = symbolic(p, pair, '+', s);
    if (n === false) return;
    interpret(p, n, s.d, s);
    if (s.grouped) explain(p, pair, s, true);
  }
  function render() {
    host.replaceChildren(); nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(step === i))); add(host, 'h2', step === 12 ? '🏆 최종 보스' : `11-${step + 1} ${titles[step]}`); const s = states[step];
    if (step === 0) rejection(host, [[1, 2], [1, 3]], '+', s, () => { step = 1; render(); });
    if (step === 1) transformer(host, [[1, 2], [1, 3]], s, d => { states[2] = { d }; step = 2; render(); });
    if (step === 2) { if (!s.d) { say(host, '먼저 두 막대를 같은 단위로 바꾸어 보세요.'); button(host, '공통 단위 변환기로', () => { step = 1; render(); }); } else operation(host, [[1, 2], [1, 3]], '+', s); }
    if (step === 3) {
      say(host, '🤖 로봇: 분자와 분모를 각각 더하면 되지!'); expression(host, [[1, 2], [1, 3]], '+', [2, 5]);
      const m = message(host); button(host, '맞아요', () => { m.textContent = '모델로 같은 양인지 확인해 보세요.'; }); button(host, '틀렸어요', () => { s.checked = true; render(); });
      if (s.checked) { model(host, [5, 6], '같은 단위로 합친 양', { first: 3 }); model(host, [2, 5], '로봇의 답'); button(host, '두 결과 겹쳐 보기', () => { s.overlay = true; render(); });
        if (s.overlay) { const overlay = add(host, 'div', '', 'ops-overlay'); for (const [cls, ratio] of [['actual', 5 / 6], ['robot', 2 / 5]]) { const fill = add(overlay, 'div', '', cls); fill.style.width = ratio * 100 + '%'; } message(host, '색칠된 끝이 달라요. 같은 양이 아니에요.');
          for (const [text, correct] of [['분모와 분자를 모두 더했어요', true], ['색칠을 너무 많이 했어요', false], ['분수가 두 개였어요', false]]) button(host, text, () => { if (correct) { s.reason = true; render(); } else m.textContent = '서로 다른 단위를 먼저 맞추었는지 살펴보세요.'; });
          if (s.reason) message(host, '같은 전체에서 분모는 단위 조각의 크기를 알려줘요. 서로 다른 크기의 조각을 같은 단위 개수로 바로 더할 수는 없어요.');
        }
      }
    }
    if (step === 4) operation(host, [[2, 3], [1, 4]], '+', s);
    if (step === 5) { if (!s.ready) rejection(host, [[3, 4], [1, 3]], '−', s, () => { s.ready = true; render(); }); else operation(host, [[3, 4], [1, 3]], '−', s); }
    if (step === 6) operation(host, [[1, 2], [1, 6]], '+', s, { reduce: true });
    if (step === 7) operation(host, [[3, 4], [2, 3]], '+', s);
    if (step === 8) operation(host, [[1, 2], [2, 3]], '+', s, { whole: 1 });
    if (step === 9) needUnit(host, s);
    if (step === 10) repair(host, s);
    if (step === 11) levels(host, s);
    if (step === 12) boss(host, s);
    const footer = add(host, 'div', '', 'reading-footer'); if (step) button(footer, '← 이전 활동', () => { step--; render(); }); if (step < 12) button(footer, '다음 활동 →', () => { step++; render(); });
  }
  titles.forEach((title, i) => { const b = button(nav, i === 12 ? '최종 보스' : `11-${i + 1}`, () => { step = i; render(); }); b.title = title; }); render();
})();


