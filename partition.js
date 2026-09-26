// 0단계 전용: 분수 기호 없이 도형을 나누고 겹쳐 보는 활동입니다.
(() => {
  const host = document.querySelector('#zero-content');
  const navigation = document.querySelector('#zero-steps');
  const titles = ['반으로 나누기', '똑같이 나누기', '등분 탐정', '자동 등분하기', '내가 등분하기', '등분 챌린지'];
  const colors = ['#ffd166', '#63b6ef', '#e995ba', '#96d5ad'];
  const state = [
    { cuts: [.5], answered: false, overlap: false },
    { cuts: [.33, .53], overlap: false },
    { selected: new Set() },
    { count: 0 },
    { shape: 'bar', cuts: [] },
    { index: 0, cuts: [], passed: false, complete: false }
  ];
  const missions = [
    { shape: 'pizza', count: 2, text: '피자를 두 친구가 공평하게 먹도록 나누세요.' },
    { shape: 'bar', count: 3, text: '막대를 똑같은 크기의 3조각으로 나누세요.' },
    { shape: 'chocolate', count: 4, text: '초콜릿을 네 친구가 똑같이 가져가도록 나누세요.' }
  ];
  for (let i = missions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [missions[i], missions[j]] = [missions[j], missions[i]];
  }
  let stage = 0;
  let diagramId = 0;
  const button = (text, action, className = '') => {
    const el = document.createElement('button');
    el.type = 'button'; el.textContent = text; el.className = className;
    el.addEventListener('click', action);
    return el;
  };
  const equal = (shares) => Math.max(...shares) - Math.min(...shares) < 1e-7;
  const widths = cuts => [0, ...cuts, 1].slice(1).map((end, i) => end - [0, ...cuts][i]);
  // 원의 넓이로 절단선 양쪽 조각의 크기를 계산합니다.
  function diskArea(position) {
    const x = Math.max(-1, Math.min(1, position * 2 - 1));
    return (x * Math.sqrt(1 - x * x) + Math.asin(x) + Math.PI / 2) / Math.PI;
  }
  function pizzaPosition(area) {
    let low = 0, high = 1;
    for (let i = 0; i < 50; i++) {
      const middle = (low + high) / 2;
      if (diskArea(middle) < area) low = middle; else high = middle;
    }
    return (low + high) / 2;
  }
  function sharesFor(shape, cuts) {
    return widths(shape === 'pizza' ? cuts.map(diskArea) : cuts);
  }
  function diagram(shape, cuts, label = '') {
    const id = `zero-diagram-${diagramId++}`;
    const points = [0, ...cuts, 1];
    if (shape === 'pizza') {
      const clips = points.slice(1).map((end, i) => `<clipPath id="${id}-${i}"><rect x="${points[i] * 240}" y="0" width="${(end - points[i]) * 240}" height="240"/></clipPath>`).join('');
      const pieces = points.slice(1).map((_, i) => `<circle cx="120" cy="120" r="120" fill="${colors[i]}" clip-path="url(#${id}-${i})"/>`).join('');
      const lines = cuts.map(p => { const x = p * 240; const y = Math.sqrt(Math.max(0, 120 ** 2 - (x - 120) ** 2)); return `<path d="M${x} ${120-y}V${120+y}" stroke="#17304d" stroke-width="2"/>`; }).join('');
      return `<svg viewBox="0 0 240 240" role="img" aria-label="${label || '나누어 보는 피자'}"><defs>${clips}</defs>${pieces}<circle cx="120" cy="120" r="120" fill="none" stroke="#704016" stroke-width="2"/>${lines}</svg>`;
    }
    return `<svg viewBox="0 0 600 100" role="img" aria-label="${label || '나누어 보는 막대'}" preserveAspectRatio="none">${points.slice(1).map((end, i) => `<rect x="${points[i] * 600}" y="0" width="${(end-points[i]) * 600}" height="100" fill="${shape === 'chocolate' ? ['#b67b53','#d59c70','#9a633e','#c28a61'][i] : colors[i]}"/>`).join('')}<rect x="1" y="1" width="598" height="98" fill="none" stroke="#17304d" stroke-width="2"/>${cuts.map(p => `<path d="M${p*600} 0V100" stroke="#17304d" stroke-width="2"/>`).join('')}</svg>`;
  }
  function pieSectors(count) {
    let a = -Math.PI / 2;
    return `<svg viewBox="0 0 240 240" role="img" aria-label="똑같은 크기의 ${count}조각으로 나눈 피자">${Array.from({length:count},(_,i) => {
      const b = a + Math.PI * 2 / count;
      const path = `<path class="division-appear" d="M120 120L${120+120*Math.cos(a)} ${120+120*Math.sin(a)}A120 120 0 0 1 ${120+120*Math.cos(b)} ${120+120*Math.sin(b)}Z" fill="${colors[i]}" stroke="#704016" stroke-width="2"/>`;
      a = b; return path;
    }).join('')}</svg>`;
  }
  function overlapPizza(cut) {
    const c = cut * 240, id = `overlap-${diagramId++}`;
    return `<p>두 조각의 자른 면을 맞춰 포갰어요. 색이 튀어나오는 곳을 살펴보세요.</p><svg class="pizza-overlay" viewBox="0 0 300 250" role="img" aria-label="두 피자 조각을 뒤집어 같은 자른 면에 맞춰 겹친 모습"><defs><clipPath id="${id}-left"><rect width="${c}" height="240"/></clipPath><clipPath id="${id}-right"><rect x="${c}" width="${240-c}" height="240"/></clipPath></defs><g transform="translate(${250-c} 5)"><circle cx="120" cy="120" r="120" fill="#ffd166" fill-opacity=".65" stroke="#b77500" stroke-width="2" clip-path="url(#${id}-left)"/></g><g transform="translate(${250+c} 5) scale(-1 1)"><circle cx="120" cy="120" r="120" fill="#3c91ea" fill-opacity=".45" stroke="#245bd6" stroke-width="2" clip-path="url(#${id}-right)"/></g><path d="M250 5V245" stroke="#17304d" stroke-dasharray="4 4"/></svg><p class="hint">노란 조각과 파란 조각을 비교해 보세요.</p>`;
  }
  function overlapBar(cuts) {
    return `<p>떼어낸 조각의 왼쪽 끝을 맞췄어요. 오른쪽 끝도 같나요?</p><svg class="bar-overlay" viewBox="0 0 600 160" role="img" aria-label="세 조각을 위아래로 놓고 길이를 비교한 모습">${widths(cuts).map((w,i)=>`<rect x="1" y="${i*52+2}" width="${w*598}" height="42" fill="${colors[i]}" stroke="#17304d" stroke-width="2"/>`).join('')}</svg>`;
  }
  // 도형 위의 44px 손잡이는 손가락 드래그와 방향키를 모두 지원합니다.
  function editor(container, shape, data, onChange, guideCount = 0) {
    const guides = Array.from({length: Math.max(0, guideCount - 1)}, (_, i) =>
      shape === 'pizza' ? pizzaPosition((i + 1) / guideCount) : (i + 1) / guideCount);
    const shell = document.createElement('div'); shell.className = `cut-editor ${shape === 'pizza' ? 'pizza-editor' : 'stick-editor'}`;
    const picture = document.createElement('div'); picture.className = 'cut-picture'; shell.append(picture);
    container.append(shell);
    const handles = data.cuts.map((_, index) => {
      const handle = document.createElement('button'); handle.type = 'button'; handle.className = 'cut-handle';
      handle.setAttribute('role', 'slider'); handle.setAttribute('aria-label', `절단선 ${index+1}`);
      handle.setAttribute('aria-orientation', 'horizontal'); shell.append(handle);
      function move(position) {
        const low = index ? data.cuts[index-1] + .06 : .08;
        const high = index < data.cuts.length-1 ? data.cuts[index+1] - .06 : .92;
        const target = guides.length ? guides.reduce((a, b) => Math.abs(a-position) < Math.abs(b-position) ? a : b) : shape === 'pizza' ? pizzaPosition((index+1)/(data.cuts.length+1)) : (index+1)/(data.cuts.length+1);
        const value = Math.max(low, Math.min(high, position));
        data.cuts[index] = target >= low && target <= high && Math.abs(value-target) <= .014 ? target : value;
        refresh(); onChange();
      }
      handle.addEventListener('pointerdown', event => {
        event.preventDefault(); handle.focus({preventScroll:true}); handle.setPointerCapture(event.pointerId);
      });
      handle.addEventListener('pointermove', event => {
        if (!handle.hasPointerCapture(event.pointerId)) return;
        const rect = shell.getBoundingClientRect(); move((event.clientX-rect.left)/rect.width);
      });
      handle.addEventListener('pointerup', event => { if (handle.hasPointerCapture(event.pointerId)) handle.releasePointerCapture(event.pointerId); });
      handle.addEventListener('keydown', event => {
        const step = event.shiftKey ? .05 : .02;
        if (['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) {
          event.preventDefault(); move(event.key === 'Home' ? .08 : event.key === 'End' ? .92 : data.cuts[index] + (event.key==='ArrowLeft' ? -step : step));
        }
      });
      return handle;
    });
    function refresh() {
      picture.innerHTML = diagram(shape, data.cuts);
      const svg = picture.querySelector('svg');
      guides.forEach(position => {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        const x = position * (shape === 'pizza' ? 240 : 600);
        const halfHeight = shape === 'pizza' ? Math.sqrt(Math.max(0, 120 ** 2 - (x - 120) ** 2)) : 50;
        const center = shape === 'pizza' ? 120 : 50;
        line.setAttribute('d', `M${x} ${center-halfHeight}V${center+halfHeight}`);
        line.setAttribute('stroke', '#ffffff');
        line.setAttribute('stroke-width', '4');
        line.setAttribute('stroke-dasharray', '7 6');
        line.setAttribute('pointer-events', 'none');
        line.classList.add('division-guide');
        svg.append(line);
        const ink = line.cloneNode(true);
        ink.setAttribute('stroke', '#334155');
        ink.setAttribute('stroke-width', '2');
        ink.classList.remove('division-guide');
        svg.append(ink);
      });
      handles.forEach((handle, i) => {
        handle.style.left = `${data.cuts[i]*100}%`;
        handle.setAttribute('aria-valuenow', String(Math.round(data.cuts[i]*100)));
        handle.setAttribute('aria-valuemin', String(Math.round((i ? data.cuts[i-1]+.06 : .08)*100)));
        handle.setAttribute('aria-valuemax', String(Math.round((i<data.cuts.length-1 ? data.cuts[i+1]-.06 : .92)*100)));
        handle.setAttribute('aria-valuetext', '좌우로 움직여 조각 크기 바꾸기');
      });
    }
    refresh();
  }
  function intro(text) { const p=document.createElement('p');p.className='zero-instruction';p.textContent=text;host.append(p); }
  function area(className='') { const el=document.createElement('div');el.className=className;host.append(el);return el; }
  function feedback() { const el=area('zero-feedback');el.setAttribute('role','status');el.setAttribute('aria-live','polite');return el; }
  function buildStage() {
    host.replaceChildren();
    navigation.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===stage)));
    const title=document.createElement('h2');title.textContent=`0-${stage+1} ${titles[stage]}`;host.append(title);
    const data=state[stage];
    if (stage===0) {
      intro('선을 손가락으로 좌우로 움직여 잘라 보세요. 두 친구에게 하나씩 주려고 합니다.');
      const model=area(); const prompt=area();prompt.innerHTML='<h3>공평하게 나누어진 것 같나요?</h3>';
      const answers=area('zero-actions');const overlay=area('zero-overlap');const message=feedback();
      const reveal=button('겹쳐보기',()=>{data.overlap=true;update();}); reveal.hidden=!data.answered;host.insertBefore(reveal,overlay);
      function update() {
        if (!data.overlap) return;
        overlay.innerHTML=overlapPizza(data.cuts[0]);
        message.textContent=equal(sharesFor('pizza',data.cuts)) ? '크기가 똑같아요! 하나의 전체를 크기가 같게 나누었어요.' : '자른 면을 맞췄을 때 두 조각이 꼭 포개지나요? 선을 다시 움직여 보세요.';
      }
      editor(model,'pizza',data,()=>{if(!data.overlap)message.textContent='';update();});
      for(const answer of ['네','아니요']) answers.append(button(answer,()=>{data.answered=true;reveal.hidden=false;message.textContent='겹쳐보기로 직접 확인해 보세요.';answers.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===answer)));}));
      update();
    } else if(stage===1) {
      intro('조각은 3개예요. 경계선을 움직여 조각의 크기를 바꿀 수 있어요.');
      const model=area();area().innerHTML='<h3>3조각으로 나누었으니 3등분일까요?</h3>';
      const answers=area('zero-actions');const overlay=area('zero-overlap');const message=feedback();
      function update() {
        if(!data.overlap)return;
        overlay.innerHTML=overlapBar(data.cuts);
        message.textContent=equal(widths(data.cuts)) ? '🎉 3등분 성공! 전체를 크기가 같은 3부분으로 나누었습니다.' : '조각은 3개지만 크기가 서로 달라요. 경계선을 움직여 같은 크기로 만들어 보세요.';
      }
      editor(model,'bar',data,update);
      for(const answer of ['맞아요','아니에요']) answers.append(button(answer,()=>{data.overlap=true;update();}));
      update();
    } else if(stage===2) {
      intro('🔍 등분된 것을 모두 찾아보세요. 그림을 누르면 선택되고, 다시 누르면 풀려요.');
      const grid=area('detective-grid'); const examples=[['pizza',[.5]],['pizza',[.35]],['bar',[.25,.5,.75]],['bar',[.15,.4,.8]]];
      const message=feedback();
      examples.forEach(([shape,cuts],i)=>{
        const b=button('',()=>{data.selected.has(i)?data.selected.delete(i):data.selected.add(i);b.setAttribute('aria-pressed',String(data.selected.has(i)));message.textContent='';});
        b.className='detective-card';b.setAttribute('aria-label',`그림 ${i+1}`);b.setAttribute('aria-pressed',String(data.selected.has(i)));
        b.innerHTML=`<span>그림 ${i+1}</span>${diagram(shape,cuts)}`;grid.append(b);
      });
      host.insertBefore(button('선택 확인',()=>{message.textContent=data.selected.size===2&&data.selected.has(0)&&data.selected.has(2)?'찾았어요! 그림 1과 그림 3은 전체를 크기가 같은 조각으로 나누었어요.':'각 그림 안에서 조각들의 크기가 서로 같은지 다시 살펴보세요.';}),message);
    } else if(stage===3) {
      intro('버튼을 누르고, 전체가 어떻게 나뉘는지 관찰해 보세요.');
      const controls=area('zero-actions');const models=area('auto-models');const message=feedback();
      function show() {
        const count=data.count;
        models.innerHTML=`<div>${count?pieSectors(count):diagram('pizza',[])}</div><div>${diagram('bar',count?Array.from({length:count-1},(_,i)=>(i+1)/count):[])}</div>`;
        models.classList.remove('animate-division');void models.offsetWidth;models.classList.add('animate-division');
        message.textContent=count?`전체 1개를 → 똑같은 크기의 ${count}조각으로 나누었습니다.`:'';
        controls.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i+2===count)));
      }
      for(const count of [2,3,4])controls.append(button(`${count}등분`,()=>{data.count=count;show();}));show();
    } else if(stage===4) {
      intro('선을 추가한 뒤 손잡이를 점선에 맞춰 움직여 보세요. 점선은 같은 크기로 나눌 위치예요. 선을 추가하면 점선도 바뀌어요.');
      const shapes=area('zero-actions');const model=area();const controls=area('zero-actions');const message=feedback();
      function draw(){model.replaceChildren();editor(model,data.shape,data,()=>{message.textContent='';},Math.max(2,data.cuts.length+1));controls.querySelector('button').disabled=data.cuts.length>=3;}
      for(const [shape,name] of [['bar','막대'],['pizza','피자']])shapes.append(button(name,()=>{data.shape=shape;data.cuts=[];message.textContent='';draw();shapes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===name)));}));
      controls.append(button('선 추가',()=>{addCut(data);message.textContent='';draw();}),button('선 모두 지우기',()=>{data.cuts=[];message.textContent='';draw();}),button('내가 나눈 것 확인',()=>{message.textContent=data.cuts.length===0?'선을 추가해 전체를 여러 조각으로 나누어 보세요.':equal(sharesFor(data.shape,data.cuts))?`🎉 ${data.cuts.length+1}등분 성공! 각 조각의 크기가 같아요.`:'조각들의 크기가 달라요. 선을 조금 움직여 다시 살펴보세요.';}));draw();
    } else {
      if(data.complete){
        area('master-message').innerHTML='<h3>🏆 등분 마스터!</h3><p>전체를 여러 부분으로 나눌 때<br>각 부분의 크기가 같아야 등분이라고 합니다.</p><p>그런데 이렇게 나눈 한 조각을 수로 나타내는 방법도 있어요.</p>';
        host.append(button('다음 단계: 1. 분수 만들기 →',()=>document.querySelector('[data-panel="explore"]').click()));
      } else {
        const mission=missions[data.index];intro(`미션 ${data.index+1} · ${mission.text}`);
        intro('점선은 같은 크기로 나눌 위치예요. 선을 추가하고 손잡이를 점선에 맞춰 보세요.');
        const model=area();const controls=area('zero-actions');const message=feedback();
        const next=button(data.index===2?'마지막 결과 보기':'다음 미션',()=>{data.index++;data.cuts=[];data.passed=false;if(data.index===3)data.complete=true;buildStage();});next.hidden=!data.passed;host.append(next);
        function changed(){data.passed=false;next.hidden=true;message.textContent='';}
        function draw(){model.replaceChildren();editor(model,mission.shape,data,changed,mission.count);controls.querySelector('button').disabled=data.cuts.length>=3;}
        controls.append(button('선 추가',()=>{addCut(data);changed();draw();}),button('선 모두 지우기',()=>{data.cuts=[];changed();draw();}),button('미션 확인',()=>{
          data.passed=data.cuts.length+1===mission.count&&equal(sharesFor(mission.shape,data.cuts));
          next.hidden=!data.passed;message.textContent=data.passed?'성공! 모두 같은 크기로 나누었어요.':`조각이 ${mission.count}개인지, 각 조각의 크기가 같은지 살펴보세요.`;
        }));draw();
      }
    }
    const footer=area('zero-footer');
    if(stage>0)footer.append(button('← 이전 활동',()=>{stage--;buildStage();}));
    if(stage<5)footer.append(button('다음 활동 →',()=>{stage++;buildStage();}));
  }
  function addCut(data){
    if(data.cuts.length>=3)return;
    const edges=[0,...data.cuts,1];let widest=0;
    for(let i=1;i<edges.length-1;i++)if(edges[i+1]-edges[i]>edges[widest+1]-edges[widest])widest=i;
    data.cuts.push(edges[widest]+(edges[widest+1]-edges[widest])*.4);data.cuts.sort((a,b)=>a-b);
  }
  titles.forEach((title,i)=>{const b=button(`0-${i+1}`,()=>{stage=i;buildStage();});b.title=title;navigation.append(b);});
  buildStage();
})();

