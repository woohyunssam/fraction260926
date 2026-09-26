// 9단계: 문제를 관찰하고 비교 전략을 선택한 뒤 모델·식·설명을 연결합니다.
(() => {
  const nav = document.querySelector('#duel-steps');
  const host = document.querySelector('#duel-content');
  const titles = ['먼저 예상하기', '한 칸의 크기 관찰', '공통분모를 찾아라', '직접 통분하고 비교', '공통분모 레이더', '전략을 골라요', '1을 기준으로', '1/2을 기준으로 · 도전', '비교 전략 선택소', '로봇의 비교 검증', '모델 없이 도전', '최종 분수 배틀'];
  const states = titles.map(() => ({}));
  const intro = [[2, 3], [3, 5]];
  const strategies = {
    denominator: '🟦 분모가 같아요', numerator: '🟨 분자가 같아요',
    one: '🟩 1과 비교해요', half: '🟪 1/2과 비교해요', common: '🟥 공통분모를 만들어요'
  };
  let step = 0;
  function node(parent, tag, text = '', className = '') {
    const element = document.createElement(tag);
    element.textContent = text; element.className = className; parent.append(element); return element;
  }
  function button(parent, text, action) {
    const b = node(parent, 'button', text); b.type = 'button'; b.addEventListener('click', action); return b;
  }
  const note = (p, text) => node(p, 'p', text, 'duel-note');
  function feedback(p, text = '') { const m = node(p, 'p', text, 'duel-feedback'); m.setAttribute('role', 'status'); return m; }
  function fraction(p, value) {
    const f = node(p, 'span', '', 'reading-fraction'); f.setAttribute('role', 'img');
    f.setAttribute('aria-label', `${value[1]}분의 ${value[0]}`);
    for (const [cls, valuePart] of [['reading-top', value[0]], ['reading-bottom', value[1]]]) {
      const part = node(f, 'span', String(valuePart), cls); part.setAttribute('aria-hidden', 'true');
    }
    return f;
  }
  function equation(p, a, b, sign = '=') {
    const row = node(p, 'div', '', 'duel-equation'); fraction(row, a); node(row, 'span', sign); fraction(row, b); return row;
  }
  const amount = v => v[0] / v[1];
  const relation = pair => Math.abs(amount(pair[0]) - amount(pair[1])) < 1e-10 ? '=' : amount(pair[0]) > amount(pair[1]) ? '>' : '<';
  const validDenominator = (pair, d) => Number.isInteger(d) && d >= 2 && d <= 120 && pair.every(v => d % v[1] === 0);
  const converted = (v, d) => [v[0] * (d / v[1]), d];
  function bars(p, pair, { touch, benchmark, labels } = {}) {
    const board = node(p, 'div', '', 'duel-models');
    const wholes = Math.max(1, ...pair.map(v => Math.ceil(amount(v))));
    pair.forEach((v, index) => {
      const row = node(board, 'div', '', `duel-model model-${index}`);
      const label = labels ? labels[index] : index ? '분수 B' : '분수 A';
      const head = node(row, 'div', '', 'duel-model-title'); node(head, 'strong', label); fraction(head, v);
      for (let whole = 0; whole < wholes; whole++) {
        if (wholes > 1) node(row, 'small', `${whole + 1}번째 전체`);
        const track = node(row, 'div', '', 'duel-bar'); track.setAttribute('role', 'group');
        track.setAttribute('aria-label', `${label} ${whole + 1}번째 전체 막대`);
        const fill = node(track, 'div', '', 'duel-fill'); fill.style.width = Math.max(0, Math.min(v[1], v[0] - whole * v[1])) / v[1] * 100 + '%';
        const grid = node(track, 'div', '', 'duel-grid'); grid.style.gridTemplateColumns = `repeat(${v[1]},minmax(0,1fr))`;
        for (let i = 0; i < v[1]; i++) {
          const cell = node(grid, touch ? 'button' : 'span', '', 'duel-cell');
          if (touch) { cell.type = 'button'; cell.setAttribute('aria-label', `${label} ${i + 1}번째 조각`); cell.onclick = () => touch(index); }
        }
        if (benchmark === 'half' && whole === 0) { const line = node(track, 'div', '', 'duel-benchmark'); line.style.left = '50%'; line.setAttribute('aria-label', '전체의 절반 기준선'); }
      }
    });
    if (benchmark === 'half') note(board, '점선은 전체의 절반이에요. 색칠된 끝이 어느 쪽에 있나요?');
    if (benchmark === 'one') note(board, '막대 하나가 전체 1이에요. 첫 막대를 다 채웠는지 살펴보세요.');
    return board;
  }
  function numeric(p, label) {
    const wrapper = node(p, 'label', label), input = node(wrapper, 'input');
    input.type = 'number'; input.min = '1'; input.max = '240'; input.step = '1'; input.required = true; input.inputMode = 'numeric'; input.setAttribute('aria-label', label); return input;
  }
  function predict(p, pair, state) {
    equation(p, ...pair, 'VS'); note(p, '어느 쪽이 더 클 것 같나요? 아직 채점하지 않고 예상만 남겨요.');
    const choices = node(p, 'div', '', 'duel-actions');
    for (const [label, sign] of [['A가 클 것 같아요', '>'], ['B가 클 것 같아요', '<'], ['같을 것 같아요', '=']]) {
      const b = button(choices, label, () => { state.prediction = sign; render(); }); b.setAttribute('aria-pressed', String(state.prediction === sign));
    }
    if (state.prediction) feedback(p, '🔍 정말 그럴까요? 선택한 전략으로 증명해 봅시다.');
  }
  function predictionRecord(p, state) {
    if (state.prediction) node(p, 'small', `내 예상: ${state.prediction === '=' ? '두 분수가 같아요' : state.prediction === '>' ? 'A가 더 커요' : 'B가 더 커요'}`, 'duel-prediction');
  }
  // 두 조절기는 원래 분모의 배수를 생성합니다. 처음부터 정답 분모를 제시하지 않습니다.
  function finder(p, pair, state, onPick) {
    FractionTools.denominatorPicker(p, pair, state, render, d => {
      state.d = d; state.conversion = 0; state.judged = false; state.explained = false; onPick?.(); render();
    });
  }
  // 분모의 변화와 분자의 변화를 학생이 직접 입력해야 등식이 완성됩니다.
  function conversion(p, pair, state, showModel) {
    if (!state.d) { finder(p, pair, state); return false; }
    note(p, `선택한 공통분모: ${state.d}`);
    state.conversion ??= 0;
    for (let i = 0; i < state.conversion; i++) equation(p, pair[i], converted(pair[i], state.d));
    if (state.conversion < 2) {
      const i = state.conversion, v = pair[i];
      node(p, 'h3', `${i ? 'B' : 'A'}를 같은 크기의 분수로 나타내기`);
      note(p, `${v[1]}에서 ${state.d}로 바꾸려면 몇 배일까요? 분자 ${v[0]}에도 같은 수를 적용해 보세요.`);
      if (showModel) bars(p, [v, converted(v, state.d)], { labels: ['바꾸기 전', '바꾼 뒤'] });
      const form = node(p, 'form', '', 'duel-form'); const factor = numeric(form, '몇 배인가요?'), numerator = numeric(form, '새 분자');
      const submit = node(form, 'button', '분수식 확인'); submit.type = 'submit'; const m = feedback(p);
      form.onsubmit = event => {
        event.preventDefault();
        if (Number(factor.value) !== state.d / v[1] || Number(numerator.value) !== v[0] * (state.d / v[1])) { m.textContent = '전체와 색칠된 양은 그대로예요. 분모와 분자에 같은 수를 적용했는지 살펴보세요.'; return; }
        state.conversion++; render();
      };
      return false;
    }
    if (showModel) bars(p, pair.map(v => converted(v, state.d)));
    return true;
  }
  function fits(pair, strategy) {
    if (strategy === 'common') return true;
    if (strategy === 'denominator') return pair[0][1] === pair[1][1];
    if (strategy === 'numerator') return pair[0][0] === pair[1][0];
    const baseline = strategy === 'one' ? 1 : .5;
    return (amount(pair[0]) - baseline) * (amount(pair[1]) - baseline) <= 0;
  }
  function explanation(pair, state) {
    if (relation(pair) === '=' && ['one', 'half'].includes(state.strategy)) return '두 분수가 모두 같은 기준과 같으므로 크기가 같아요';
    if (state.strategy === 'common') return `한 칸의 크기를 ${state.d}분의 1로 맞췄으므로 색칠된 조각 수를 비교할 수 있어요`;
    if (state.strategy === 'denominator') return '이미 한 칸의 크기가 같으므로 색칠된 조각 수를 비교해요';
    if (state.strategy === 'numerator') return '같은 개수의 조각이므로 한 조각이 더 큰 쪽의 분수가 커요';
    return `${state.strategy === 'one' ? '전체 1' : '전체의 절반'}을 기준으로 한쪽은 크고 다른 쪽은 작거나 같아요`;
  }
  function judgment(p, pair, state, { compact = false } = {}) {
    note(p, '어느 분수가 더 큰가요? 근거를 확인하고 판정하세요.');
    const choices = node(p, 'div', '', 'duel-actions'), m = feedback(p);
    for (const [label, sign] of [['A가 크다', '>'], ['B가 크다', '<'], ['같다', '=']]) button(choices, compact ? sign : label, () => {
      if (sign !== relation(pair)) { m.textContent = '선택한 전략의 기준과 색칠된 양을 다시 살펴보세요. 이유까지 확인하면 판정할 수 있어요.'; return; }
      state.judged = true; render();
    });
    if (!state.judged) return;
    equation(p, ...pair, relation(pair));
    if (state.strategy === 'common') equation(p, ...pair.map(v => converted(v, state.d)), relation(pair));
    if (state.prediction) note(p, state.prediction === relation(pair) ? '내 예상과 실제 결과가 같았어요!' : '처음 예상과 달랐네요. 근거를 확인하고 생각을 바꾸었어요!');
    note(p, '왜 그렇게 생각했나요? 이유까지 설명해 보세요.');
    const reasons = node(p, 'div', '', 'duel-reasons'), reasonMessage = feedback(p);
    button(reasons, explanation(pair, state), () => { state.explained = true; render(); });
    button(reasons, '분자 숫자가 큰 분수가 언제나 더 커요', () => { reasonMessage.textContent = '분자가 달라도 조각 크기가 다를 수 있어요. 지금 선택한 전략을 생각해 보세요.'; });
    button(reasons, '분모 숫자가 큰 분수가 언제나 더 커요', () => { reasonMessage.textContent = '전체가 같을 때 더 많이 나누면 한 조각은 작아져요. 모델과 기준을 다시 생각해 보세요.'; });
    if (state.explained) feedback(p, '⭐⭐⭐ 판정과 이유를 모두 설명했어요!');
  }
  function strategyTask(p, pair, state, { options = Object.keys(strategies), model = 'always', compact = false } = {}) {
    equation(p, ...pair, '?');
    const modelVisible = model === 'always' || state.showModel;
    if (model === 'optional') button(p, state.showModel ? '막대 숨기기' : '막대 보기', () => { state.showModel = !state.showModel; render(); });
    if (modelVisible && !state.strategy) bars(p, pair);
    note(p, '어떤 비교 전략을 사용할까요?');
    const choices = node(p, 'div', '', 'duel-actions'), m = feedback(p);
    for (const key of options) {
      const b = button(choices, strategies[key], () => {
        if (!fits(pair, key)) { m.textContent = key === 'denominator' ? '두 분모가 서로 달라요. 한 칸의 크기를 먼저 생각해 보세요.' : key === 'numerator' ? '두 분자가 서로 달라요. 다른 전략으로 확인해 보세요.' : '두 분수가 그 기준의 같은 쪽에 있어요. 이 기준만으로는 결론 내릴 수 없어요.'; return; }
        if (state.strategy !== key) { state.strategy = key; state.judged = false; state.explained = false; } render();
      }); b.setAttribute('aria-pressed', String(state.strategy === key));
    }
    if (!state.strategy) return;
    if (state.strategy === 'common') {
      if (!conversion(p, pair, state, modelVisible)) return;
    } else {
      if (modelVisible) bars(p, pair, { benchmark: state.strategy });
      if (state.strategy === 'denominator') note(p, '이미 같은 크기의 조각이에요. 색칠한 조각 수를 살펴보세요.');
      if (state.strategy === 'numerator') note(p, '같은 개수의 조각이에요. 같은 전체를 더 많이 나눌 때 한 조각은 어떻게 될까요?');
      if (['one', 'half'].includes(state.strategy)) {
        const baseline = state.strategy === 'one' ? 1 : .5;
        state.sides ??= [];
        pair.forEach((v, i) => {
          const box = node(p, 'div', '', 'duel-actions'); note(box, `${i ? 'B' : 'A'}는 ${baseline === 1 ? '1' : '1/2'}과 비교하면?`);
          for (const [text, sign] of [['작아요', -1], ['같아요', 0], ['커요', 1]]) {
            const b = button(box, `${i ? 'B' : 'A'}: ${text}`, () => {
              if (sign !== Math.sign(amount(v) - baseline)) { m.textContent = '기준까지 얼마나 채워졌는지 다시 살펴보세요.'; return; }
              state.sides[i] = state.strategy; render();
            }); b.setAttribute('aria-pressed', String(state.sides[i] === state.strategy && sign === Math.sign(amount(v) - baseline)));
          }
        });
        if (!pair.every((_, i) => state.sides[i] === state.strategy)) return;
      }
    }
    judgment(p, pair, state, { compact });
  }
  function problems(p, pairs, state, taskOptions = {}) {
    state.index ??= 0; state.problems ??= pairs.map(() => ({}));
    const tabs = node(p, 'div', '', 'duel-actions');
    pairs.forEach((pair, i) => { const b = button(tabs, `문제 ${i + 1}`, () => { state.index = i; render(); }); b.setAttribute('aria-pressed', String(state.index === i)); });
    strategyTask(p, pairs[state.index], state.problems[state.index], taskOptions);
  }
  function radar(p, state) {
    state.counts ??= [1, 1]; const bases = [4, 6];
    equation(p, [3, 4], [5, 6], 'VS'); note(p, '배수를 직접 늘려 공통으로 나타나는 숫자를 찾아보세요.');
    const common = [];
    for (let n = 1; n <= state.counts[0]; n++) if ((4 * n) % 6 === 0 && 4 * n <= 6 * state.counts[1]) common.push(4 * n);
    bases.forEach((d, i) => {
      node(p, 'h3', `${d}의 배수`); const row = node(p, 'div', '', 'duel-actions');
      for (let k = 1; k <= state.counts[i]; k++) node(row, 'span', `${d * k}${common.includes(d * k) ? ' ⭐' : ''}`, common.includes(d * k) ? 'duel-hit' : 'duel-number');
      const b = button(p, `${d}의 다음 배수 만들기`, () => { state.counts[i]++; render(); }); b.disabled = d * (state.counts[i] + 1) > 60;
    });
    if (common.length) {
      note(p, '발견한 공통분모는 모두 쓸 수 있어요. 선택해 모델을 확인하세요.');
      const row = node(p, 'div', '', 'duel-actions'); common.forEach(d => button(row, `${d} 사용해 보기`, () => { state.d = d; render(); }));
      if (state.d) { bars(p, [[3, 4], [5, 6]].map(v => converted(v, state.d))); [[3, 4], [5, 6]].forEach(v => equation(p, v, converted(v, state.d))); }
      if (common.length > 1) { note(p, '두 분모가 가장 먼저 만나는 수는 무엇인가요?'); const m = feedback(p); common.forEach(d => button(p, `${d}이 가장 먼저 만나요`, () => { m.textContent = d === common[0] ? `${d}은 두 분모가 가장 먼저 만나는 수예요. 가장 작은 공통 배수, 최소공배수라고도 해요. 더 적은 조각으로 나타낼 수 있어요.` : '이 수도 가능하지만, 더 먼저 만난 수가 있는지 살펴보세요.'; })); }
    }
  }
  function levels(p, state) {
    state.level ??= 0; state.tasks ??= Array.from({ length: 4 }, () => ({}));
    const pairs = [[[3, 4], [5, 6]], [[3, 5], [3, 8]], [[2, 3], [3, 5]], [[7, 8], [5, 4]]];
    const tabs = node(p, 'div', '', 'duel-actions');
    for (let i = 0; i < 4; i++) { const b = button(tabs, `LEVEL ${i + 1}`, () => { state.level = i; render(); }); b.setAttribute('aria-pressed', String(state.level === i)); }
    const level = state.level, task = state.tasks[level];
    note(p, ['막대를 보고 공통분모를 찾아 비교해요.', '분수만 보고 생각해요. 필요하면 막대 보기를 누르세요.', '그림 없이 전략과 분수식으로 증명해요.', '먼저 부등호를 고르고, 이유를 증명해요.'][level]);
    if (level === 3 && !task.initialSign) {
      equation(p, ...pairs[level], '?'); const a = node(p, 'div', '', 'duel-actions');
      for (const sign of ['<', '>', '=']) button(a, sign, () => { task.initialSign = sign; task.prediction = sign; render(); });
      return;
    }
    if (task.initialSign) note(p, `내 첫 판정: ${task.initialSign} · 전략으로 확인해요.`);
    strategyTask(p, pairs[level], task, { model: ['always', 'optional', 'none', 'none'][level], options: level === 0 ? ['common'] : Object.keys(strategies), compact: level === 3 });
    if (task.explained && level < 3) button(p, '다음 LEVEL', () => { state.level++; render(); });
  }
  function battle(p, state) {
    const pair = [[5, 6], [7, 9]]; predictionRecord(p, state);
    if (!state.prediction) { predict(p, pair, state); return; }
    strategyTask(p, pair, state, { model: 'optional' });
    if (state.explained) {
      node(p, 'h3', '⚔️ 마지막 설명을 완성하세요');
      note(p, '선택한 공통분모와 바뀐 두 분자를 문장에 넣어 보세요.');
      const form = node(p, 'form', '', 'duel-form'); const denominator = numeric(form, '문장의 공통분모'), a = numeric(form, 'A의 바뀐 분자'), b = numeric(form, 'B의 바뀐 분자');
      const submit = node(form, 'button', '배틀 설명 완성'); submit.type = 'submit'; const m = feedback(p);
      form.onsubmit = event => { event.preventDefault(); if (Number(denominator.value) !== state.d || Number(a.value) !== converted(pair[0], state.d)[0] || Number(b.value) !== converted(pair[1], state.d)[0]) { m.textContent = '내가 선택한 공통분모와 완성한 두 분수식을 다시 확인해 보세요.'; return; } state.complete = true; render(); };
    }
    if (state.complete) {
      feedback(p, '🏆 분수 배틀 완료! 예상, 전략, 분수식, 이유를 모두 연결했어요.');
      note(p, `두 분수는 분모가 다르므로 ${state.d}을 공통분모로 하여 비교했습니다. ${converted(pair[0], state.d)[0]}/${state.d}이 ${converted(pair[1], state.d)[0]}/${state.d}보다 크므로 5/6이 더 큽니다.`);
      equation(p, ...pair, '>');
    }
  }
  function render() {
    host.replaceChildren(); nav.querySelectorAll('button').forEach((b, i) => b.setAttribute('aria-pressed', String(step === i)));
    node(host, 'h2', `9-${step + 1} ${titles[step]}`); const state = states[step];
    if (step === 0) predict(host, intro, state);
    if (step === 1) {
      predictionRecord(host, states[0]); note(host, '막대 전체 길이는 같아요. 각 막대의 한 칸을 눌러 크기를 살펴보세요.');
      bars(host, intro, { touch: i => { state.touched ??= new Set(); state.touched.add(i); state.last = i; render(); } });
      if (state.last !== undefined) { const row = node(host, 'div', '', 'duel-equation'); node(row, 'span', `${state.last ? 'B' : 'A'}의 한 칸`); fraction(row, [1, intro[state.last][1]]); }
      if (state.touched?.size === 2) feedback(host, '한 칸의 크기가 서로 달라요. 같은 크기의 칸으로 바꿀 수 있을까요?');
    }
    if (step === 2) {
      predictionRecord(host, states[0]); equation(host, ...intro, 'VS'); finder(host, intro, state);
      if (state.d) { bars(host, intro.map(v => converted(v, state.d))); button(host, '이 공통분모로 직접 통분하기', () => { states[3] = { d: state.d, conversion: 0, strategy: 'common', prediction: states[0].prediction }; step = 3; render(); }); }
    }
    if (step === 3) {
      state.strategy = 'common'; state.prediction = states[0].prediction; predictionRecord(host, state);
      if (conversion(host, intro, state, true)) judgment(host, intro, state);
    }
    if (step === 4) radar(host, state);
    if (step === 5) problems(host, [[[3, 7], [5, 7]], [[3, 5], [3, 8]], [[7, 8], [2, 3]]], state);
    if (step === 6) problems(host, [[[7, 8], [5, 4]], [[11, 10], [7, 8]]], state, { options: ['one', 'common'] });
    if (step === 7) { note(host, '선택 도전! 전체의 절반을 기준으로 비교해 보세요. 어려우면 다음 활동으로 넘어가도 좋아요.'); strategyTask(host, [[5, 8], [4, 9]], state, { options: ['half', 'common'] }); }
    if (step === 8) problems(host, [[[3, 7], [5, 7]], [[3, 5], [3, 8]], [[7, 8], [5, 4]], [[5, 8], [4, 9]], intro, [[1, 2], [2, 4]]], state, { model: 'optional' });
    if (step === 9) {
      state.index ??= 0; state.robots ??= [{}, {}]; const robot = state.robots[state.index];
      const controls = node(host, 'div', '', 'duel-actions'); button(controls, '분자만 본 로봇', () => { state.index = 0; render(); }); button(controls, '분모만 본 로봇', () => { state.index = 1; render(); });
      const pair = state.index === 0 ? [[3, 5], [2, 3]] : [[2, 7], [2, 9]];
      note(host, state.index === 0 ? '🤖 3/5이 2/3보다 커! 분자 3이 2보다 크니까!' : '🤖 2/7이 2/9보다 작아! 분모 7이 9보다 작으니까!');
      const m = feedback(host); button(host, '맞는 설명이에요', () => { m.textContent = '두 분수의 조각 크기도 생각해 보세요. 숫자 하나만으로 판단해도 될까요?'; });
      button(host, '잘못된 설명이에요', () => { robot.challenged = true; render(); });
      if (robot.challenged) { note(host, '어떤 전략으로 로봇의 비교를 고칠까요?'); strategyTask(host, pair, robot, { options: state.index === 0 ? ['common', 'denominator'] : ['numerator', 'common'] }); }
    }
    if (step === 10) levels(host, state);
    if (step === 11) battle(host, state);
    const footer = node(host, 'div', '', 'reading-footer');
    if (step > 0) button(footer, '← 이전 활동', () => { step--; render(); });
    if (step < 11) button(footer, '다음 활동 →', () => { step++; render(); });
  }
  titles.forEach((title, i) => { const b = button(nav, `9-${i + 1}`, () => { step = i; render(); }); b.title = title; });
  render();
})();


