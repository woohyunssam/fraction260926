// 9・11단계가 함께 사용하는 공통분모 조절기입니다.
const FractionTools = {
  denominatorPicker(parent, pair, state, redraw, onPick, limit = 120) {
    const add = (p, tag, text = '', cls = '') => { const e = document.createElement(tag); e.textContent = text; e.className = cls; p.append(e); return e; };
    const button = (p, text, action) => { const b = add(p, 'button', text); b.type = 'button'; b.onclick = action; return b; };
    state.multipliers ??= [1, 1];
    const controls = add(parent, 'div', '', 'duel-finder');
    pair.forEach((v, i) => {
      const box = add(controls, 'div'); add(box, 'strong', `${i ? 'B' : 'A'} 분할 조절기`);
      const actions = add(box, 'div', '', 'duel-actions');
      const previous = button(actions, `${i ? 'B' : 'A'} 이전 배수`, () => { state.multipliers[i]--; redraw(); }); previous.disabled = state.multipliers[i] === 1;
      add(actions, 'output', String(v[1] * state.multipliers[i]), 'duel-denominator');
      const next = button(actions, `${i ? 'B' : 'A'} 다음 배수`, () => { state.multipliers[i]++; redraw(); }); next.disabled = v[1] * (state.multipliers[i] + 1) > limit;
    });
    const values = pair.map((v, i) => v[1] * state.multipliers[i]);
    if (values[0] === values[1]) {
      const m = add(parent, 'p', `🎯 ${values[0]} = ${values[1]}! 같은 크기의 조각을 만들 수 있어요.`, 'duel-feedback'); m.setAttribute('role', 'status');
      button(parent, `${values[0]}을 공통분모로 사용`, () => onPick(values[0]));
    } else add(parent, 'p', `두 분모가 만나는 수를 찾아보세요. ${limit}까지 탐구할 수 있어요.`);
  }
};
