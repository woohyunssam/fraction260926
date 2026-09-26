// 각 막대는 자신만의 분모와 색칠 상태를 가집니다.
const list = document.querySelector('#bars');
const template = document.querySelector('#bar-template');
let nextId = 1;

function createBar(denominator = 4, selected = [], isCopy = false, after = null, options = {}) {
  const id = options.name || `막대 ${nextId++}`;
  const target = options.target || list;
  const colored = new Set(selected);
  const card = template.content.firstElementChild.cloneNode(true);
  card.setAttribute('aria-label', id);
  card.querySelector('h2').textContent = id;
  const choices = card.querySelector('.denominators');
  const bar = card.querySelector('.fraction-bar');
  const fraction = card.querySelector('.fraction');
  const note = card.querySelector('.change-note');
  const defaultNote = '';
  choices.title = isCopy ? '같은 양을 나타낼 수 있으면 색칠을 유지해요.' : '분모를 바꾸면 색칠이 초기화돼요.';
  note.textContent = defaultNote;

  function updateResult() {
    card.querySelector('.numerator').textContent = colored.size;
    card.querySelector('.fraction-denominator').textContent = denominator;
    fraction.setAttribute('aria-label', `${denominator}분의 ${colored.size}`);
    card.querySelector('.description').textContent = `전체 ${denominator}칸 중 ${colored.size}칸을 색칠했어요.`;
    if (options.onChange) options.onChange();
  }

  function renderBar() {
    bar.replaceChildren();
    bar.style.setProperty('--denominator', denominator);
    for (let index = 0; index < denominator; index++) {
      const piece = document.createElement('button');
      piece.type = 'button';
      piece.className = 'piece';
      piece.setAttribute('aria-label', `${index + 1}번째 칸`);
      piece.setAttribute('aria-pressed', String(colored.has(index)));
      piece.addEventListener('click', () => {
        if (options.singlePiece) { colored.clear(); colored.add(index); renderBar(); return; }
        if (colored.has(index)) colored.delete(index);
        else colored.add(index);
        piece.setAttribute('aria-pressed', String(colored.has(index)));
        updateResult();
      });
      bar.append(piece);
    }
    updateResult();
  }

  for (let value = 2; value <= 12; value++) {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = value;
    choices.append(option);
  }
  choices.value = denominator;
  choices.addEventListener('change', () => {
      const value = Number(choices.value);
      if (denominator === value) return;
      const scaledCount = colored.size * value;
      const exact = scaledCount % denominator === 0;
      const newColored = [];
      if (isCopy && exact) {
        // 칸의 경계가 맞으면 색칠 위치도 유지합니다.
        for (let j = 0; j < value; j++) {
          const first = Math.floor(j * denominator / value);
          const last = Math.ceil((j + 1) * denominator / value) - 1;
          let fullyColored = true;
          for (let k = first; k <= last; k++) if (!colored.has(k)) fullyColored = false;
          if (fullyColored) newColored.push(j);
        }
        // 흩어진 색칠을 새 칸으로 표현할 수 없으면 같은 양을 왼쪽에 모읍니다.
        if (newColored.length !== scaledCount / denominator) {
          newColored.length = 0;
          for (let j = 0; j < scaledCount / denominator; j++) newColored.push(j);
          note.textContent = '같은 양의 색칠을 왼쪽부터 모았어요.';
        } else note.textContent = defaultNote;
      } else {
        note.textContent = isCopy && !exact
          ? '이 분모로는 같은 양을 온전한 칸으로 나타낼 수 없어 색칠을 지웠어요.'
          : defaultNote;
      }
      denominator = value;
      colored.clear();
      newColored.forEach(index => colored.add(index));
      if (options.singlePiece) colored.add(0);
      renderBar();
  });

  card.querySelector('.duplicate').addEventListener('click', () => {
    const copy = createBar(denominator, [...colored], true, card);
    copy.querySelector('.duplicate').focus({ preventScroll: true });

  });
  card.fractionValue = () => colored.size / denominator;
  card.fractionParts = () => ({ numerator: colored.size, denominator });
  if (options.name) card.querySelector('.duplicate').remove();
  renderBar();
  if (after) after.after(card);
  else target.append(card);
  if (target.children.length > 1 || options.name) {
    target.classList.add('has-copies');
    for (const row of target.children) {
      const heading = row.querySelector('.row-heading');
      heading.insertBefore(row.querySelector('.description'), heading.querySelector('label'));
      heading.insertBefore(row.querySelector('.fraction'), row.querySelector('.description'));
    }
  }
  return card;
}

createBar();


document.querySelectorAll('[data-panel]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelector('#home-menu').hidden = true;
    document.querySelector('#learning-header').hidden = false;
    document.querySelector('main').classList.remove('at-home');
    const firstActivity = button.dataset.panel === 'partition';
    document.querySelector('header h1').textContent = firstActivity ? '똑같이 나누어 볼까요?' : '색칠하며 분수를 만들어요';
    document.querySelector('header > p:last-child').textContent = firstActivity ? '하나의 전체를 공평하게 나누어 보세요.' : '색칠한 부분을 보며 분수의 크기를 비교해 보세요.';
    if (button.dataset.panel === 'units') { document.querySelector('header h1').textContent = '8. 같은 크기의 조각을 만들어라!'; document.querySelector('header > p:last-child').textContent = '서로 다른 분수를 같은 크기의 조각으로 나타내 볼까요?'; }
    if (button.dataset.panel === 'duel') { document.querySelector('header h1').textContent = '9. 분수 대결 — 누가 더 클까?'; document.querySelector('header > p:last-child').textContent = '예상하고, 전략을 고르고, 이유를 설명해 보세요.'; }
    if (button.dataset.panel === 'pieces') { document.querySelector('header h1').textContent = '10. 분수 조각을 합쳐라!'; document.querySelector('header > p:last-child').textContent = '같은 크기의 조각을 합치고 빼면 무엇이 달라질까요?'; }
    if (button.dataset.panel === 'operations') { document.querySelector('header h1').textContent = '11. 조각의 크기를 맞춰라!'; document.querySelector('header > p:last-child').textContent = '공통 단위를 만들고 같은 조각끼리 계산해 보세요.'; }
    if (button.dataset.panel === 'master') { document.querySelector('header h1').textContent = '12. 분수 마스터 — 네 생각을 증명하라!'; document.querySelector('header > p:last-child').textContent = '먼저 생각하고, 모델로 검증하고, 이유를 설명해 보세요.'; }
    if (button.dataset.panel === 'reading') {
      document.querySelector('header h1').textContent = '분수 읽기 — 숫자의 비밀을 찾아라';
      document.querySelector('header > p:last-child').textContent = '그림 속 숫자는 어디에서 왔을까요?';
    }
    if (button.dataset.panel === 'grouping') {
      document.querySelector('header h1').textContent = '6. 전체를 묶어라!';
      document.querySelector('header > p:last-child').textContent = '전체를 만들고, 남은 조각을 살펴보세요.';
    }
    if (button.dataset.panel === 'beyond') {
      document.querySelector('header h1').textContent = '5. 1을 넘어가도 분수일까?';
      document.querySelector('header > p:last-child').textContent = '같은 크기의 조각을 하나씩 모아 보세요.';
    }
    if (button.dataset.panel === 'equivalent') { document.querySelector('header h1').textContent = '7. 모양은 달라도 크기는 같아!'; document.querySelector('header > p:last-child').textContent = '다시 나누고, 묶고, 겹쳐 보며 같은 크기를 발견해 보세요.'; }
    if (button.dataset.panel === 'compare') {
      document.querySelector('header h1').textContent = '4. 분수 크기 비교';
      document.querySelector('header > p:last-child').textContent = '먼저 예상하고, 같은 전체에서 색칠한 길이를 비교해 보세요.';
    }
    if (button.dataset.panel === 'detective') {
      document.querySelector('header h1').textContent = '분수 탐정 — 그림 속 분수를 찾아라';
      document.querySelector('header > p:last-child').textContent = '색칠된 부분은 전체의 얼마일까요?';
    }
    for (const choice of document.querySelectorAll('[data-panel]')) {
      const active = choice === button;
      choice.setAttribute('aria-pressed', String(active));
      document.querySelector(`#${choice.dataset.panel}`).hidden = !active;
    }
    document.querySelector('header h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  });
});

// 홈으로 돌아가도 학습 화면을 다시 만들지 않아 조작 상태가 유지됩니다.
document.querySelector('#go-home').addEventListener('click', () => {
  const previous = document.querySelector('[data-panel][aria-pressed="true"]');
  for (const button of document.querySelectorAll('[data-panel]')) {
    document.querySelector(`#${button.dataset.panel}`).hidden = true;
    button.setAttribute('aria-pressed', 'false');
  }
  document.querySelector('#learning-header').hidden = true;
  document.querySelector('#home-menu').hidden = false;
  document.querySelector('main').classList.add('at-home');
  if (previous) previous.focus({ preventScroll: true });
  window.scrollTo(0, 0);
});






