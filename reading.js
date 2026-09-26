// 2단계: 그림과 숫자를 연결합니다. 다른 활동과 상태를 공유하지 않습니다.
(() => {
  const host = document.querySelector('#reading-content');
  const nav = document.querySelector('#reading-steps');
  const titles = ['그림에서 숫자 꺼내기', '숫자를 누르면?', '숫자로 그림 만들기', '그림을 분수로', '분수 기계', '로봇 그림 고치기'];
  const words = ['영','일','이','삼','사','오','육','칠','팔','구','십','십일','십이'];
  const states = [{phase:0}, {}, {d:4,n:3,divided:false,painted:false}, {phase:0}, {d:6,n:4,mode:'numbers',done:false}, {round:0,reason:false,solved:false,complete:false}];
  let step = 0, timer;
  function node(tag, className='', text='') { const e=document.createElement(tag);e.className=className;e.textContent=text;return e; }
  function button(text, action) { const b=node('button','',text);b.type='button';b.addEventListener('click',action);return b; }
  function section(className='') { const e=node('div',className);host.append(e);return e; }
  function message() {const e=section('reading-feedback');e.setAttribute('role','status');e.setAttribute('aria-live','polite');return e;}
  function say(text){host.append(node('p','reading-instruction',text));}
  function fraction(n,d,interactive=false){
    const el=node('span','reading-fraction');
    if(!interactive){el.setAttribute('role','img');el.setAttribute('aria-label',`${d===null?'빈칸':d}분의 ${n===null?'빈칸':n}`);}
    for(const [kind,value] of [['top',n],['bottom',d]]){
      const part=node(interactive?'button':'span',`reading-${kind}`,value===null?'□':String(value));
      if(interactive){part.type='button';part.setAttribute('aria-label',`${kind==='top'?'분자':'분모'} ${value}`);}else part.setAttribute('aria-hidden','true');
      el.append(part);
    }
    return el;
  }
  function model(d,n){
    const bar=node('div','reading-bar');bar.style.setProperty('--parts',d||1);bar.setAttribute('role','img');
    // 첫 활동에서는 접근성 설명에도 정답 숫자를 미리 넣지 않습니다.
    bar.setAttribute('aria-label','같은 크기로 나누고 일부를 색칠한 막대');
    for(let i=0;i<(d||1);i++){const cell=node('span','reading-cell'+(i<n?' painted':''));bar.append(cell);}
    return bar;
  }
  function picker(label, min,max,value,onChange){
    const wrap=node('label','reading-picker',label+' '),select=document.createElement('select');select.setAttribute('aria-label',label);
    for(let i=min;i<=max;i++){const option=node('option','',String(i));option.value=i;select.append(option);}select.value=value;
    select.addEventListener('change',()=>onChange(Number(select.value)));wrap.append(select);return wrap;
  }
  function resetMachine(){clearTimeout(timer);}
  function build(){
    resetMachine();host.replaceChildren();nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));
    host.append(node('h2','',`2-${step+1} ${titles[step]}`));const data=states[step];
    if(step===0||step===3) discover(data,step===0?4:5,step===0?3:2);
    if(step===1) reactions();
    if(step===2) dragNumbers(data);
    if(step===4) machine(data);
    if(step===5) robot(data);
    const footer=section('reading-footer');if(step>0)footer.append(button('← 이전 활동',()=>{step--;build();}));if(step<5)footer.append(button('다음 활동 →',()=>{step++;build();}));
  }
  function discover(data,d,n){
    say('그림을 먼저 보고, 숫자가 어디에서 오는지 찾아보세요.');host.append(model(d,n));
    const answer=section('reading-answer');
    if(data.phase>0){answer.append(fraction(data.phase===2?n:null,d));if(data.phase===2)answer.classList.add('numbers-join');}
    if(data.phase===2){
      answer.append(node('strong','',`${words[d]}분의 ${words[n]}`));
      const terms=section('reading-terms');terms.append(node('p','',`위 숫자 ${n} — 분자: 그중 색칠한 부분의 수`),node('p','',`아래 숫자 ${d} — 분모: 전체를 똑같이 나눈 부분의 수`));
      const done=message();done.textContent=`🎉 ${words[d]}분의 ${words[n]}! 전체를 ${d}등분한 것 중 ${n}부분입니다.`;return;
    }
    const question=data.phase===0?'전체를 똑같이 몇 부분으로 나누었나요?':'그중 색칠한 부분은 몇 부분인가요?';
    host.append(node('h3','',question));const form=node('form','reading-form');const input=document.createElement('input');input.type='number';input.inputMode='numeric';input.min='0';input.max='12';input.step='1';input.required=true;input.setAttribute('aria-label',question);input.autocomplete='off';
    const submit=node('button','','숫자 확인');submit.type='submit';form.append(input,submit);host.append(form);const feedback=message();
    form.addEventListener('submit',event=>{event.preventDefault();const expected=data.phase===0?d:n;if(Number(input.value)===expected){data.phase++;build();const next=host.querySelector('input');if(next)next.focus({preventScroll:true});}else{feedback.textContent=data.phase===0?'색칠하지 않은 부분도 포함해서 모든 칸을 세어 보세요.':'색칠된 칸만 하나씩 세어 보세요.';}});
  }
  function reactions(){
    say('위 숫자와 아래 숫자를 눌러 그림이 어떻게 반응하는지 살펴보세요.');
    const bar=model(4,3);host.append(bar);const f=fraction(3,4,true);section('reading-answer').append(f);const feedback=message();
    function react(kind){bar.classList.remove('highlight-whole','highlight-colored');void bar.offsetWidth;bar.classList.add(kind==='bottom'?'highlight-whole':'highlight-colored');feedback.textContent=kind==='bottom'?'분모 4: 전체를 똑같이 4부분으로 나누었다는 뜻이에요.':'분자 3: 그중 3부분을 나타낸다는 뜻이에요.';}
    f.querySelector('.reading-bottom').addEventListener('click',()=>react('bottom'));f.querySelector('.reading-top').addEventListener('click',()=>react('top'));
  }
  // 포인터 드래그와 누르기 대안을 함께 제공합니다.
  function draggable(token, target, apply){
    let start=null,moved=false,suppress=false;
    token.classList.add('number-token');
    token.addEventListener('pointerdown',e=>{if(token.disabled)return;start={x:e.clientX,y:e.clientY};moved=false;suppress=false;token.setPointerCapture(e.pointerId);});
    token.addEventListener('pointermove',e=>{if(!start||!token.hasPointerCapture(e.pointerId))return;const dx=e.clientX-start.x,dy=e.clientY-start.y;if(Math.abs(dx)+Math.abs(dy)>8)moved=true;if(moved){token.style.transform=`translate(${dx}px,${dy}px)`;token.classList.add('dragging');target.classList.add('drop-ready');}});
    function clear(){start=null;token.style.transform='';token.classList.remove('dragging');target.classList.remove('drop-ready');}
    token.addEventListener('pointerup',e=>{if(!start)return;const r=target.getBoundingClientRect();const hit=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;suppress=moved;clear();if(token.hasPointerCapture(e.pointerId))token.releasePointerCapture(e.pointerId);if(moved&&hit)apply();});
    token.addEventListener('pointercancel',()=>{suppress=true;clear();});
    token.addEventListener('click',()=>{if(suppress){suppress=false;return;}apply();});
  }
  function dragNumbers(data){
    say('먼저 아래 숫자로 전체를 나누고, 위 숫자로 색칠해 보세요. 숫자를 막대에 끌어 놓거나 눌러 넣을 수 있어요.');
    const controls=section('reading-actions');
    controls.append(picker('분모 선택',2,12,data.d,value=>{data.d=value;data.n=Math.min(data.n,value);data.divided=false;data.painted=false;build();}),picker('분자 선택',0,data.d,data.n,value=>{data.n=value;data.painted=false;build();}));
    const tokens=section('reading-answer');const f=fraction(null,null);tokens.append(f);
    const top=f.querySelector('.reading-top'),bottom=f.querySelector('.reading-bottom');
    const denominator=button(String(data.d),()=>{});denominator.setAttribute('aria-label',`분모 ${data.d} 넣기`);
    const numerator=button(data.divided?String(data.n):'□',()=>{});numerator.setAttribute('aria-label',`분자 ${data.n} 넣기`);numerator.disabled=!data.divided;
    top.replaceWith(numerator);bottom.replaceWith(denominator);numerator.classList.add('reading-top');denominator.classList.add('reading-bottom');f.removeAttribute('role');f.removeAttribute('aria-label');
    const drop=section('reading-drop');drop.setAttribute('aria-label','숫자를 넣을 막대');drop.append(model(data.divided?data.d:0,data.painted?data.n:0));
    const feedback=message();feedback.textContent=!data.divided?`분모가 ${data.d}라면 전체를 어떻게 나누어야 할까요?`:!data.painted?`전체를 ${data.d}등분했어요. 이제 분자 ${data.n}을 넣어 보세요.`:`전체를 ${data.d}등분하고 ${data.n}부분을 색칠했어요.`;
    draggable(denominator,drop,()=>{data.divided=true;data.painted=false;build();});draggable(numerator,drop,()=>{data.painted=true;build();});
  }
  function machine(data){
    say('숫자를 바꾸고 기계를 작동해 보세요. 아래 숫자가 먼저 전체를 나누고, 위 숫자가 색칠할 부분을 정해요.');
    const modes=section('reading-actions');for(const [value,text] of [['numbers','숫자 → 그림과 분수'],['symbol','분수 → 그림']]){const b=button(text,()=>{data.mode=value;data.done=false;build();});b.setAttribute('aria-pressed',String(data.mode===value));modes.append(b);}
    const shell=section('fraction-machine');shell.append(node('h3','','분수 기계'));
    const inputs=node('div',data.mode==='symbol'?'machine-input reading-fraction':'reading-actions');shell.append(inputs);
    const denominator=picker('분모',2,12,data.d,v=>{data.d=v;data.n=Math.min(v,data.n);data.done=false;build();});const numerator=picker('분자',0,data.d,data.n,v=>{data.n=v;data.done=false;build();});
    if(data.mode==='symbol'){numerator.classList.add('reading-top');denominator.classList.add('reading-bottom');inputs.append(numerator,denominator);}else inputs.append(denominator,numerator);
    const output=node('div','machine-output');const feedback=node('p','reading-feedback');feedback.setAttribute('role','status');
    const run=button('기계 작동',()=>{
      data.done=false;run.disabled=true;output.replaceChildren(model(data.d,0));feedback.textContent=`전체를 ${data.d}등분했어요.`;
      timer=setTimeout(()=>{data.done=true;showResult();run.disabled=false;},650);
    });shell.append(run,output,feedback);
    function showResult(){output.replaceChildren(model(data.d,data.n));const result=node('div','reading-answer');result.append(fraction(data.n,data.d),node('strong','',`${words[data.d]}분의 ${words[data.n]}`));output.append(result);feedback.textContent=`${data.d}등분 → ${data.n}칸 색칠. 아래 숫자는 전체를 나눈 수, 위 숫자는 나타낸 부분의 수예요.`;}
    if(data.done)showResult();
  }
  function robot(data){
    if(data.complete){say('두 가지 실수를 모두 고쳤어요!');section('reading-answer').append(fraction(3,5));const finish=section('reading-terms');finish.append(node('h3','','그림을 보며 내 말로 설명해 보세요.'),node('p','','아래 숫자는 전체를 몇 등분했는지, 위 숫자는 그중 몇 부분인지 나타내요.'));host.append(button('다시 도전',()=>{data.round=0;data.reason=false;data.solved=false;data.complete=false;build();}));return;}
    say(`로봇 그림 ${data.round+1} · AI 로봇이 이 분수를 그렸어요. 맞게 그렸을까요?`);section('reading-answer').append(fraction(3,5));
    const bar=model(data.solved?5:data.round===0?4:5,data.solved?3:data.round===0?3:2);host.append(bar);const feedback=message();
    if(data.solved){feedback.textContent=data.round===0?'고쳤어요! 전체를 5등분하고 3칸을 색칠했어요.':'고쳤어요! 전체 5칸은 그대로 두고 3칸을 색칠했어요.';host.append(button(data.round===0?'다음 로봇 그림':'발견한 것 정리',()=>{if(data.round===0){data.round=1;data.reason=false;data.solved=false;}else data.complete=true;build();}));return;}
    const answers=section('reading-actions');answers.append(button('맞아요',()=>{feedback.textContent='아래 숫자와 전체 칸 수, 위 숫자와 색칠한 칸 수를 하나씩 비교해 보세요.';}),button('틀렸어요',()=>{data.reason=true;build();}));
    if(data.reason){host.append(node('h3','','어떤 점이 다를까요?'));const reasons=section('reading-reasons');
      const labels=data.round===0?['색칠을 3칸 해서','전체를 5등분하지 않아서','색깔이 달라서']:['전체를 5등분해서','색칠을 3칸 하지 않아서','색깔이 달라서'];
      labels.forEach((text,index)=>reasons.append(button(text,()=>{
        if(index!==1){feedback.textContent='전체 칸 수와 색칠한 칸 수를 각각 다시 세어 보세요.';return;}
        reasons.replaceChildren();feedback.textContent=data.round===0?'맞아요! 색칠한 칸은 3칸이지만 전체가 5칸이 아니에요.':'맞아요! 전체는 5칸이지만 색칠한 칸이 3칸이 아니에요.';
        const fixes=section('reading-actions');fixes.append(button(data.round===0?'전체를 5등분으로 고치기':'색칠을 3칸으로 고치기',()=>{data.solved=true;build();}));
      })));
    }
  }
  titles.forEach((title,i)=>{const b=button(`2-${i+1}`,()=>{step=i;build();});b.title=title;nav.append(b);});build();
})();
