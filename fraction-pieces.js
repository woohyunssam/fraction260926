// 10단계: 같은 단위 조각을 옮기고, 개수와 크기를 구분합니다.
(() => {
  const host = document.querySelector('#pieces-content'), nav = document.querySelector('#pieces-steps');
  const titles = ['조각 합치기', '왜 3/10이 아닐까?', '분모 잠금장치', '조각 빼기', '식과 모델을 오가요', '1을 넘는 덧셈', '대분수 덧셈 · 도전', '분수 계산 수리공', '다른 크기의 조각이라면?'];
  const states = titles.map(() => ({})); let step = 0;
  const add = (p, tag, text = '', cls = '') => { const e = document.createElement(tag); e.textContent = text; e.className = cls; p.append(e); return e; };
  function button(p, text, fn) { const b = add(p, 'button', text); b.type = 'button'; b.onclick = fn; return b; }
  const say = (p, text) => add(p, 'p', text, 'pieces-instruction');
  function feedback(p, text = '') { const m = add(p, 'p', text, 'pieces-feedback'); m.setAttribute('role', 'status'); return m; }
  function frac(p, n, d, locked = false) {
    const f = add(p, 'span', '', 'reading-fraction'); f.setAttribute('role', 'img'); f.setAttribute('aria-label', `${d}분의 ${n}`);
    add(f, 'span', String(n), 'reading-top'); add(f, 'span', `${locked ? '🔒' : ''}${d}`, 'reading-bottom'); return f;
  }
  function expression(p, a, b, d, op = '+', result, locked = false) {
    const row = add(p, 'div', '', 'pieces-equation'); frac(row, a, d, locked); add(row, 'span', op); frac(row, b, d, locked);
    if (result !== undefined) { add(row, 'span', '='); frac(row, result, d, locked); } return row;
  }
  function mixed(p, n, d) {
    const row = add(p, 'div', '', 'pieces-equation'); frac(row, n, d); add(row, 'span', '='); add(row, 'strong', String(Math.floor(n / d)));
    if (n % d) frac(row, n % d, d); return row;
  }
  function input(p, label) { const l = add(p, 'label', label), i = add(l, 'input'); i.type = 'number'; i.min = '0'; i.max = '40'; i.step = '1'; i.required = true; i.inputMode = 'numeric'; i.setAttribute('aria-label', label); return i; }
  function answer(p, label, expected, success) {
    const form = add(p, 'form', '', 'pieces-form'), i = input(form, label), submit = add(form, 'button', '확인'); submit.type = 'submit'; const m = feedback(p);
    form.onsubmit = e => { e.preventDefault(); if (Number(i.value) !== expected) { m.textContent = '조각의 크기는 그대로예요. 조각을 하나씩 다시 세어 보세요.'; return; } success(); render(); };
  }
  // 한 전체의 폭을 유지합니다. 1을 넘으면 같은 폭의 막대를 추가합니다.
  function model(p, n, d, label = '', { first = n, count = Math.max(1, Math.ceil(n / d)), select, chosen } = {}) {
    if (label) add(p, 'h3', label);
    const board = add(p, 'div', '', 'pieces-model');
    for (let whole = 0; whole < count; whole++) {
      if (count > 1) add(board, 'small', `${whole + 1}번째 전체`);
      const bar = add(board, 'div', '', 'pieces-bar'); bar.style.gridTemplateColumns = `repeat(${d}, minmax(0,1fr))`; bar.setAttribute('role', 'group'); bar.setAttribute('aria-label', `${label || '분수'} ${whole + 1}번째 전체`);
      for (let i = 0; i < d; i++) {
        const index = whole * d + i, filled = chosen ? chosen.has(index) : index < n;
        const cell = add(bar, select ? 'button' : 'span', '', `pieces-cell${filled ? index < first ? ' filled' : ' added' : ''}`);
        if (select) { cell.type = 'button'; cell.setAttribute('aria-label', `${label} ${index + 1}번째 칸`); cell.setAttribute('aria-pressed', String(filled)); cell.onclick = () => select(index); }
      }
    }
    return board;
  }
  // 포인터 드래그와 클릭/키보드 조작을 함께 지원합니다. Set으로 중복 이동을 막습니다.
  function draggable(token, target, apply) {
    let start, moved = false, suppress = false;
    token.classList.add('pieces-draggable');
    token.addEventListener('pointerdown', e => { start = [e.clientX, e.clientY]; moved = false; suppress = false; token.setPointerCapture(e.pointerId); });
    token.addEventListener('pointermove', e => { if (!start) return; const x = e.clientX - start[0], y = e.clientY - start[1]; if (Math.abs(x) + Math.abs(y) > 8) moved = true; if (moved) { token.style.transform = `translate(${x}px,${y}px)`; token.classList.add('moving'); } });
    function clear() { start = null; token.style.transform = ''; token.classList.remove('moving'); }
    token.addEventListener('pointerup', e => { if (!start) return; const r = target.getBoundingClientRect(), hit = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; suppress = moved; clear(); if (token.hasPointerCapture(e.pointerId)) token.releasePointerCapture(e.pointerId); if (moved && hit) apply(); });
    token.addEventListener('pointercancel', () => { suppress = true; clear(); });
    token.addEventListener('click', () => { if (suppress) { suppress = false; return; } apply(); });
  }
  function token(p, d, label, color = '') {
    const b = add(p, 'button', '', `pieces-token ${color}`); b.type = 'button'; b.setAttribute('aria-label', label); frac(b, 1, d); return b;
  }
  function tokenGrid(p, d, cls = '') { const row = add(p, 'div', '', `pieces-token-grid ${cls}`); row.style.gridTemplateColumns = `repeat(${d}, minmax(0,1fr))`; return row; }
  function collect(p, a, b, d, state) {
    state.moved ??= new Set();
    say(p, 'A와 B의 조각을 모음 바구니로 옮기세요. 드래그하거나 조각을 눌러도 돼요.');
    const source = add(p, 'div', '', 'pieces-sources'), target = add(p, 'div', '', 'pieces-drop'); target.setAttribute('role', 'group'); target.setAttribute('aria-label', '모음 바구니');
    add(target, 'strong', '모음 바구니');
    for (const [name, number, offset] of [['A', a, 0], ['B', b, a]]) {
      add(source, 'h3', `${name} 바구니`); const grid = tokenGrid(source, d);
      for (let i = 0; i < number; i++) {
        const id = offset + i; if (state.moved.has(id)) continue;
        const t = token(grid, d, `${name} 조각 ${i + 1} 옮기기`, name === 'B' ? 'orange' : '');
        draggable(t, target, () => { state.moved.add(id); render(); });
      }
      if (![...Array(number).keys()].some(i => !state.moved.has(offset + i))) say(grid, '모두 옮겼어요.');
    }
    const grid = tokenGrid(target, d);
    for (const id of [...state.moved].sort((x, y) => x - y)) { const t = token(grid, d, `모은 조각 ${id + 1} 되돌리기`, id >= a ? 'orange' : ''); t.onclick = () => { state.moved.delete(id); state.placed = false; state.answered = false; state.reason = false; state.grouped = false; render(); }; }
    if (state.moved.size === a + b) {
      if (!state.placed) button(p, '모은 조각을 막대에 넣기', () => { state.placed = true; render(); });
      if (state.placed) model(p, a + b, d, '모은 조각', { first: a });
      return state.placed;
    }
    return false;
  }
  function reason(p, d, state) {
    say(p, '🔒 분모는 왜 그대로일까요?'); const m = feedback(p);
    button(p, '원래 분모는 계산하지 않으니까', () => { m.textContent = '외운 방법 말고, 조각에 어떤 변화가 있었는지 설명해 보세요.'; });
    button(p, `조각의 크기 ${d}분의 1이 변하지 않았으니까`, () => { state.reason = true; render(); });
    button(p, '분모가 큰 수니까', () => { m.textContent = '큰 수인지보다 한 조각의 크기를 생각해 보세요.'; });
    if (state.reason) feedback(p, `맞아요! ${d}분의 1짜리 조각의 개수만 바뀌고 크기는 그대로예요.`);
  }
  function addition(p, a, b, d, state, { locked = false, beyond = false } = {}) {
    if (locked || beyond) expression(p, a, b, d, '+', undefined, locked);
    if (!collect(p, a, b, d, state)) return;
    if (!state.answered) { answer(p, `${d}분의 1 조각은 모두 몇 개인가요?`, a + b, () => { state.answered = true; }); return; }
    expression(p, a, b, d, '+', a + b, locked);
    if (locked) reason(p, d, state);
    if (beyond) {
      button(p, '🧩 전체로 묶어 보기', () => { state.grouped = true; render(); });
      if (state.grouped) { mixed(p, a + b, d); say(p, `조각 ${d}개가 전체 1을 만들고 ${a + b - d}개가 남았어요. 같은 양을 대분수로도 나타낼 수 있어요.`); }
    }
  }
  function subtract(p, state) {
    state.removed ??= new Set(); expression(p, 5, 2, 7, '−', undefined, true);
    say(p, '칠분의 일 조각 2개를 꺼내세요. 조각을 꺼낸 바구니로 끌거나 눌러 옮길 수 있어요.');
    const track = tokenGrid(p, 7, 'pieces-subtract'), target = add(p, 'div', '', 'pieces-drop'); target.setAttribute('aria-label', '꺼낸 조각 바구니'); target.setAttribute('role', 'group'); add(target, 'strong', '꺼낸 조각 바구니'); const m = feedback(p);
    for (let i = 0; i < 7; i++) {
      if (i >= 5 || state.removed.has(i)) { add(track, 'span', '', 'pieces-empty'); continue; }
      const t = token(track, 7, `${i + 1}번째 조각 꺼내기`);
      draggable(t, target, () => { if (state.removed.size >= 2) { m.textContent = '이번에는 2조각만 꺼내요. 남은 조각을 세어 보세요.'; return; } state.removed.add(i); render(); });
    }
    const out = tokenGrid(target, 7);
    for (const id of state.removed) { const t = token(out, 7, `${id + 1}번째 조각 되돌리기`, 'orange'); t.onclick = () => { state.removed.delete(id); state.answered = false; render(); }; }
    say(p, `5개의 조각에서 ${state.removed.size}개를 꺼냈어요.`);
    if (state.removed.size === 2) {
      if (!state.answered) answer(p, '남은 조각 수', 3, () => { state.answered = true; });
      else { expression(p, 5, 2, 7, '−', 3, true); feedback(p, '조각의 개수만 줄었고, 칠분의 일이라는 조각의 크기는 그대로예요.'); }
    }
  }
  function directions(p, state) {
    state.mode ??= 0; state.tasks ??= [{}, {}, {}]; const tabs = add(p, 'div', '', 'pieces-actions');
    ['모델 → 식', '식 → 모델', '결과 → 여러 식'].forEach((text, i) => { const b = button(tabs, text, () => { state.mode = i; render(); }); b.setAttribute('aria-pressed', String(state.mode === i)); });
    const t = state.tasks[state.mode];
    if (state.mode === 0) {
      model(p, 4, 8, 'A 막대'); add(p, 'strong', '+'); model(p, 2, 8, 'B 막대'); say(p, '그림을 보고 덧셈식을 완성하세요.');
      const form = add(p, 'form', '', 'pieces-form'), a = input(form, 'A의 분자'), b = input(form, 'B의 분자'), sum = input(form, '결과의 분자'); say(form, '분모는 8'); const submit = add(form, 'button', '식 확인'); submit.type = 'submit'; const m = feedback(p);
      form.onsubmit = e => { e.preventDefault(); if (Number(a.value) === 4 && Number(b.value) === 2 && Number(sum.value) === 6) { t.done = true; render(); } else m.textContent = '각 막대의 색칠된 조각과 합친 조각 수를 다시 세어 보세요.'; };
      if (t.done) { expression(p, 4, 2, 8, '+', 6); model(p, 6, 8, '합친 결과', { first: 4 }); }
    } else if (state.mode === 1) {
      expression(p, 3, 2, 7); t.a ??= new Set(); t.b ??= new Set();
      for (const key of ['a', 'b']) model(p, 0, 7, key === 'a' ? 'A 막대' : 'B 막대', { chosen: t[key], select: index => { t[key].has(index) ? t[key].delete(index) : t[key].add(index); t.done = false; render(); } });
      const m = feedback(p); button(p, '합치기', () => { if (t.a.size !== 3 || t.b.size !== 2) { m.textContent = 'A에는 3조각, B에는 2조각을 색칠해 보세요.'; return; } t.done = true; render(); });
      if (t.done) { model(p, 5, 7, '합친 결과', { first: 3 }); expression(p, 3, 2, 7, '+', 5); }
    } else {
      model(p, 5, 7, '목표 결과'); say(p, '합치면 이 결과가 되는 두 분수를 만들어 보세요. 여러 답을 찾을 수 있어요.');
      const form = add(p, 'form', '', 'pieces-form'), a = input(form, '첫 분자의 수'), b = input(form, '둘째 분자의 수'); say(form, '두 분모는 모두 7'); const submit = add(form, 'button', '발견 기록'); submit.type = 'submit'; const m = feedback(p);
      form.onsubmit = e => { e.preventDefault(); const x = Number(a.value), y = Number(b.value); if (!Number.isInteger(x) || !Number.isInteger(y) || x + y !== 5 || x < 0 || y < 0) { m.textContent = '두 바구니를 합쳐 조각이 5개가 되게 해 보세요.'; return; } t.records ??= new Map(); t.records.set(`${x},${y}`, [x, y]); render(); };
      if (t.records) for (const [x, y] of t.records.values()) expression(p, x, y, 7, '+', 5);
    }
  }
  function mixedAddition(p, state) {
    state.mode ??= 0; state.tasks ??= [{}, {}]; const tabs = add(p, 'div', '', 'pieces-actions');
    button(tabs, '전체 1과 2/5에 1/5 더하기', () => { state.mode = 0; render(); }); button(tabs, '도전: 전체 1과 4/5에 3/5 더하기', () => { state.mode = 1; render(); });
    const a = state.mode ? 4 : 2, b = state.mode ? 3 : 1, t = state.tasks[state.mode];
    const equation = add(p, 'div', '', 'pieces-equation'); add(equation, 'strong', '1'); frac(equation, a, 5); add(equation, 'span', '+'); frac(equation, b, 5);
    model(p, 5, 5, '이미 완성된 전체 1');
    if (!collect(p, a, b, 5, t)) return;
    if (!t.answered) { answer(p, '합친 분수 부분의 조각 수', a + b, () => { t.answered = true; }); return; }
    expression(p, a, b, 5, '+', a + b);
    button(p, '🧩 기존 전체와 함께 묶기', () => { t.grouped = true; render(); });
    if (t.grouped) { model(p, 5 + a + b, 5, '모두 합친 양'); mixed(p, 5 + a + b, 5); feedback(p, state.mode ? '새로 전체 1개가 더 생겼어요. 원래 전체와 합쳐 전체 2개와 오분의 이예요.' : '원래 전체 1개에 오분의 삼이 남아요.'); }
  }
  function repair(p, state) {
    state.mode ??= 'robot'; const tabs = add(p, 'div', '', 'pieces-actions');
    button(tabs, '로봇 오류 찾기', () => { state.mode = 'robot'; render(); }); button(tabs, '모델 없이 계산 도전', () => { state.mode = 'practice'; render(); });
    const robots = [[3, 2, 7, '+', 5, 14], [6, 2, 9, '−', 4, 9], [2, 4, 5, '+', 6, 5], [7, 3, 8, '−', 4, 0], [3, 2, 8, '+', 6, 8], [5, 2, 6, '−', 4, 12]];
    const practice = [[2, 4, 9, '+'], [7, 3, 8, '−'], [3, 3, 5, '+'], [4, 4, 7, '−']];
    const robot = state.mode === 'robot'; state.index ??= 0; state.quiz ??= {}; const list = robot ? robots : practice, index = state.index % list.length;
    const [a, b, d, op, proposedN, proposedD] = list[index], result = op === '+' ? a + b : a - b;
    const key = `${state.mode}-${index}`; const t = state.quiz[key] ??= {};
    say(p, `${robot ? '로봇' : '계산'} 문제 ${index + 1} / ${list.length}`);
    const row = expression(p, a, b, d, op);
    if (robot) {
      add(row, 'span', '='); const claimed = add(row, 'span', '', 'pieces-robot-fraction');
      const top = button(claimed, String(proposedN), () => choosePart('numerator')), bottom = button(claimed, String(proposedD), () => choosePart('denominator'));
      top.setAttribute('aria-label', '로봇 결과의 분자'); bottom.setAttribute('aria-label', '로봇 결과의 분모');
      const m = feedback(p); const correct = proposedN === result && proposedD === d;
      button(p, '맞아요', () => { if (correct) { t.accepted = true; render(); } else m.textContent = '조각 수와 한 조각의 크기를 다시 확인해 보세요.'; });
      button(p, '틀렸어요', () => { if (!correct) { t.challenge = true; render(); } else m.textContent = '같은 크기의 조각을 합치거나 뺀 결과를 세어 보세요.'; });
      function choosePart(part) {
        if (!t.challenge) { m.textContent = '먼저 로봇의 식이 맞는지 판단해 보세요.'; return; }
        const expected = proposedN !== result && proposedD !== d ? 'both' : proposedN !== result ? 'numerator' : 'denominator';
        if (part !== expected) { m.textContent = '분자는 조각 수, 분모는 단위 조각의 크기와 연결해서 확인해 보세요.'; return; } t.part = true; render();
      }
      if (t.challenge) { say(p, '로봇 결과에서 잘못된 숫자를 직접 누르세요.'); button(p, '분자와 분모 모두 틀렸어요', () => choosePart('both')); }
      if (t.part) {
        const form = add(p, 'form', '', 'pieces-form'), n = input(form, '고친 분자'), den = input(form, '고친 분모'); const submit = add(form, 'button', '수리 확인'); submit.type = 'submit';
        form.onsubmit = e => { e.preventDefault(); if (Number(n.value) === result && Number(den.value) === d) { t.accepted = true; render(); } else m.textContent = '같은 크기의 조각은 개수만 달라져요. 다시 고쳐 보세요.'; };
      }
    } else {
      if (!t.accepted) { const form = add(p, 'form', '', 'pieces-form'), n = input(form, '답의 분자'), den = input(form, '답의 분모'); const submit = add(form, 'button', '계산 확인'); submit.type = 'submit'; const m = feedback(p);
        form.onsubmit = e => { e.preventDefault(); if (Number(n.value) === result && Number(den.value) === d) { t.accepted = true; render(); } else m.textContent = '지금은 약분하지 않고 원래 단위 조각으로 답해 보세요. 필요하면 막대 보기를 누르세요.'; };
      }
    }
    button(p, t.show ? '막대 숨기기' : '막대 보기', () => { t.show = !t.show; render(); });
    if (t.show) { model(p, a, d, '처음 조각'); model(p, b, d, op === '+' ? '더할 조각' : '꺼낼 조각'); }
    if (t.accepted) { expression(p, a, b, d, op, result); reason(p, d, t); if (t.reason) button(p, index === list.length - 1 ? '처음 문제로' : '다음 문제', () => { state.index = (index + 1) % list.length; render(); }); }
  }
  function trap(p, state) {
    const row = add(p, 'div', '', 'pieces-equation'); frac(row, 1, 2); add(row, 'span', '+'); frac(row, 1, 3);
    model(p, 1, 2, '이분의 일 조각'); model(p, 1, 3, '삼분의 일 조각');
    button(p, '두 조각을 그대로 합치기', () => { state.attempted = true; render(); });
    if (!state.attempted) return;
    feedback(p, '조각의 크기가 달라서 같은 단위 조각의 개수로 바로 합칠 수 없어요!');
    say(p, '어떻게 같은 크기의 조각으로 만들까요?'); const m = feedback(p);
    button(p, '분자끼리, 분모끼리 더해요', () => { m.textContent = '그렇게 하면 한 조각의 크기가 바뀌어요. 8단계에서 배운 공통 단위를 떠올려 보세요.'; });
    button(p, '통분해서 조각 크기를 같게 만들어요', () => { state.ready = true; render(); });
    if (state.ready) {
      feedback(p, '🚪 다음 탐구로 갈 준비가 되었어요! 같은 크기의 조각으로 바꾸면 합칠 수 있어요.');
      button(p, '11단계 시작하기', () => document.querySelector('[data-panel="operations"]').click());
      button(p, '11단계 연결: 같은 조각으로 바꿔 보기', () => { state.preview = true; render(); });
      if (state.preview) {
        model(p, 3, 6, '이분의 일을 육분의 삼으로'); model(p, 2, 6, '삼분의 일을 육분의 이로');
        button(p, '이제 같은 조각을 합치기', () => { state.merged = true; render(); });
        if (state.merged) { model(p, 5, 6, '합친 양', { first: 3 }); expression(p, 3, 2, 6, '+', 5); say(p, '다음 11단계에서는 서로 다른 분모의 덧셈·뺄셈을 더 탐구할 거예요.'); }
      }
    }
  }
  function render() {
    host.replaceChildren(); nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(step === i)));
    add(host, 'h2', `10-${step + 1} ${titles[step]}`); const state = states[step];
    if (step === 0) addition(host, 2, 1, 5, state);
    if (step === 1) {
      say(host, '🤖 로봇: 오분의 이와 오분의 일을 더하면 십분의 삼이야!'); const row = expression(host, 2, 1, 5); add(row, 'span', '='); frac(row, 3, 10);
      const m = feedback(host); button(host, '맞아요', () => { m.textContent = '처음 조각은 오분의 일이었어요. 로봇의 답에서는 한 조각이 어떤 크기인가요?'; }); button(host, '틀렸어요', () => { state.checked = true; render(); });
      if (state.checked) {
        model(host, 3, 5, '오분의 삼'); model(host, 3, 10, '십분의 삼');
        button(host, '한 조각 확대해서 비교', () => { state.zoom = true; render(); });
        if (state.zoom) { const zoom = add(host, 'div', '', 'pieces-zoom'); model(zoom, 1, 5, '오분의 일'); model(zoom, 1, 10, '십분의 일'); say(host, '오분의 일 조각을 합쳤는데 십분의 일 조각으로 바뀌어도 될까요?'); button(host, '아니요, 조각 크기는 그대로여야 해요', () => { state.reason = true; render(); }); }
        if (state.reason) { expression(host, 2, 1, 5, '+', 3); feedback(host, '분모 5는 전체를 5등분한 단위 조각의 크기를 알려줘요. 분자 3은 그 조각의 개수예요.'); }
      }
    }
    if (step === 2) addition(host, 3, 2, 8, state, { locked: true });
    if (step === 3) subtract(host, state);
    if (step === 4) directions(host, state);
    if (step === 5) addition(host, 3, 2, 4, state, { beyond: true });
    if (step === 6) { say(host, '심화 도전: 이미 있는 전체는 두고 분수 조각부터 합쳐 보세요.'); mixedAddition(host, state); }
    if (step === 7) repair(host, state);
    if (step === 8) trap(host, state);
    if (step > 0) say(host, '같은 전체에서, 분모는 단위 조각의 크기를 알려주고 분자는 그 조각의 개수를 나타내요.');
    const footer = add(host, 'div', '', 'reading-footer'); if (step) button(footer, '← 이전 활동', () => { step--; render(); }); if (step < titles.length - 1) button(footer, '다음 활동 →', () => { step++; render(); });
  }
  titles.forEach((title, i) => { const b = button(nav, `10-${i + 1}`, () => { step = i; render(); }); b.title = title; }); render();
})();
