// 3단계는 그림 관찰 → 전체 확인 → 선택된 부분 해석에 집중합니다.
(() => {
  const host=document.querySelector('#detective-content');
  const nav=document.querySelector('#detective-steps');
  const titles=['보고 고르기','두 번 터치하기','모양이 달라도','색칠에 속지 마!','가짜 분수 고치기','색칠 위치가 달라도?','분수 탐정 미션'];
  let step=0;
  const states=Array.from({length:7},()=>({}));
  function el(tag,cls='',text=''){const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;}
  function btn(text,fn){const b=el('button','',text);b.type='button';b.addEventListener('click',fn);return b;}
  function area(parent,cls=''){const e=el('div',cls);parent.append(e);return e;}
  function say(parent,text){parent.append(el('p','detective-instruction',text));}
  function feedback(parent){const e=area(parent,'detective-feedback');e.setAttribute('role','status');e.setAttribute('aria-live','polite');return e;}
  function fraction(n,d){const f=el('span','reading-fraction');f.setAttribute('role','img');f.setAttribute('aria-label',`${d===null?'빈칸':d}분의 ${n===null?'빈칸':n}`);for(const [cls,v] of [['reading-top',n],['reading-bottom',d]]){const e=el('span',cls,v===null?'□':String(v));e.setAttribute('aria-hidden','true');f.append(e);}return f;}
  const consecutive=n=>Array.from({length:n},(_,i)=>i);
  function model(shape,d,selected,click){
    const chosen=new Set(selected),box=el('div',`detective-model ${shape}`);box.setAttribute('role',click?'group':'img');box.setAttribute('aria-label',click?'직접 세어 보는 그림':'관찰할 전체 그림');
    if(shape==='circle'){
      let angle=-Math.PI/2;
      const paths=Array.from({length:d},(_,i)=>{const next=angle+2*Math.PI/d;const path=`<path d="M120 120L${120+118*Math.cos(angle)} ${120+118*Math.sin(angle)}A118 118 0 ${d===1?1:0} 1 ${120+118*Math.cos(next)} ${120+118*Math.sin(next)}Z" fill="${chosen.has(i)?'#245bd6':'#f5f8fc'}" stroke="#17304d" stroke-width="2"/>`;angle=next;return path;}).join('');
      box.innerHTML=`<svg viewBox="0 0 240 240" aria-hidden="true">${paths}</svg>`;return box;
    }
    box.style.setProperty('--parts',d);box.style.setProperty('--columns',d%2===0?d/2:d);
    for(let i=0;i<d;i++){
      const cell=el(click?'button':'span','detective-cell'+(chosen.has(i)?' painted':''));
      if(click){cell.type='button';cell.setAttribute('aria-label',`${i+1}번째 칸`);cell.setAttribute('aria-pressed','false');cell.addEventListener('click',()=>click(i,cell));}box.append(cell);
    }
    return box;
  }
  function explanation(parent,n,d){const row=area(parent,'detective-explanation');row.append(el('p','',`전체를 ${d}등분했어요. → 분모 ${d}`),el('p','',`그중 ${n}부분이 색칠됐어요. → 분자 ${n}`));const result=area(row,'reading-answer');result.append(el('span','','따라서'),fraction(n,d));}
  function choices(parent,data,{d,n,shape='bar',positions=consecutive(n)},done){
    say(parent,'먼저 전체 그림을 관찰해 보세요. 모든 칸을 살핀 다음 색칠한 칸을 찾아보세요.');parent.append(model(shape,d,positions));
    if(data.solved){explanation(parent,n,d);done?.();return;}
    const slot=area(parent);
    const reveal=()=>{
      data.observed=true;slot.replaceChildren();say(slot,'색칠된 부분을 나타내는 분수를 골라 보세요.');
      const answers=area(slot,'detective-answers');const msg=feedback(slot);
      for(const [a,b] of [[1,d],[n,d],[n,n]]){
        const answer=btn('',()=>{if(a===n&&b===d){data.solved=true;slot.replaceChildren();explanation(slot,n,d);done?.();}else msg.textContent='전체 칸 수를 먼저 살피고, 그중 색칠된 칸 수를 찾아보세요.';});answer.setAttribute('aria-label',`${b}분의 ${a}`);answer.append(fraction(a,b));answers.append(answer);
      }
    };
    if(data.observed)reveal();else slot.append(btn('관찰했어요 · 분수 고르기',reveal));
  }
  function twoTouches(parent,data,{d,n,shape='bar',positions=consecutive(n)},done){
    data.phase??=0;parent.append(model(shape,d,positions));const slot=area(parent);
    function draw(){
      slot.replaceChildren();if(data.phase===2){explanation(slot,n,d);done?.();return;}
      const question=data.phase===0?'🔍 전체를 몇 부분으로 똑같이 나누었나요?':'🔍 그중 색칠된 부분은 몇 개인가요?';say(slot,question);
      if(data.phase===1)area(slot,'reading-answer').append(fraction(null,d));
      const numbers=area(slot,'detective-answers');const msg=feedback(slot);
      for(let i=1;i<=Math.max(6,d);i++)numbers.append(btn(String(i),()=>{
        if(i===(data.phase===0?d:n)){data.phase++;draw();}else msg.textContent=data.phase===0?'색칠하지 않은 칸도 전체에 들어가요. 모든 칸을 세어 보세요.':'색칠된 부분만 다시 살펴보세요.';
      }));
    }draw();
  }
  function shapes(parent,data,{d=4,n=3}={},done){
    say(parent,'같은 분수를 막대, 원, 격자에서 찾아보세요. 모양마다 전체와 색칠한 부분을 살펴보세요.');data.index??=0;data.progress??=[{},{},{}];
    const names=['막대','원','격자'],types=['bar','circle','grid'];const controls=area(parent,'detective-answers');const canvas=area(parent);
    function show(){canvas.replaceChildren();controls.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===data.index)));twoTouches(canvas,data.progress[data.index],{d,n,shape:types[data.index]},()=>{
      if(data.progress.every(p=>p.phase===2)){const msg=feedback(canvas);msg.textContent=`모양이 달라도 전체를 ${d}등분하고 그중 ${n}부분이면 같은 분수예요.`;done?.();}
      else if(data.index<2)canvas.append(btn('다음 모양 관찰',()=>{data.index++;show();}));
    });}
    names.forEach((name,i)=>controls.append(btn(name,()=>{data.index=i;show();})));show();
  }
  function trap(parent,data){
    say(parent,'둘 다 3칸이 색칠되어 있어요. 같은 분수일까요?');const pair=area(parent,'detective-pair');for(const [name,d] of [['A',4],['B',5]]){const card=area(pair);card.append(el('h3','',name),model('bar',d,consecutive(3)));}
    const actions=area(parent,'detective-answers');const slot=area(parent);const msg=feedback(parent);
    function reasons(){slot.replaceChildren();say(slot,'왜 다를까요?');for(const [i,text] of ['색깔이 달라서','전체를 나눈 부분의 수가 달라서','색칠한 수가 같아서'].entries())slot.append(btn(text,()=>{
      if(i!==1){msg.textContent='두 그림의 전체를 나눈 수가 같은지 살펴보세요.';return;}
      data.solved=true;slot.replaceChildren();msg.textContent='색칠한 수가 같아도 전체를 나눈 수가 달라서 다른 분수예요.';const eq=area(slot,'reading-answer');eq.append(fraction(3,4),el('span','','≠'),fraction(3,5));
    }));}
    actions.append(btn('네',()=>{msg.textContent='색칠한 칸만 보지 말고, 전체 칸 수도 살펴보세요.';}),btn('아니요',()=>{data.reason=true;reasons();}));
    if(data.solved){msg.textContent='색칠한 수가 같아도 전체를 나눈 수가 달라서 다른 분수예요.';const eq=area(slot,'reading-answer');eq.append(fraction(3,4),el('span','','≠'),fraction(3,5));}else if(data.reason)reasons();
  }
  function repair(parent,data,{d=5,n=2,wrongD=4}={},done){
    data.phase??=0;data.counted??=new Set();data.colored??=new Set();
    say(parent,'로봇이 그림에 붙인 분수 이름을 확인해 보세요.');const label=area(parent,'reading-answer');label.append(el('span','','🤖 이 그림은'),fraction(n,wrongD),el('span','','이 분수야!'));
    const picture=area(parent);const work=area(parent);const msg=feedback(parent);
    function draw(){
      picture.replaceChildren();work.replaceChildren();
      if(data.phase===3){picture.append(model('bar',d,consecutive(n)));label.classList.add('wrong-fraction');explanation(work,n,d);msg.textContent='직접 세어서 잘못된 분수 이름을 고쳤어요!';done?.();return;}
      if(data.phase===0){picture.append(model('bar',d,consecutive(n)));const actions=area(work,'detective-answers');actions.append(btn('맞아요',()=>{msg.textContent='전체를 나눈 수와 아래 숫자가 맞는지 살펴보세요.';}),btn('틀렸어요',()=>{data.phase=1;msg.textContent='';draw();}));return;}
      const counting=data.phase===1?data.counted:data.colored;const target=data.phase===1?d:n;
      say(work,data.phase===1?'전체 칸을 하나씩 직접 눌러 세어 보세요.':'이번에는 색칠된 칸만 하나씩 눌러 세어 보세요.');
      const counter=el('p','detective-counter',`지금까지 ${counting.size}칸`);work.append(counter);
      if(data.phase===2)area(work,'reading-answer').append(fraction(null,d));
      const bar=model('bar',d,consecutive(n),(index,cell)=>{
        if(data.phase===2&&index>=n){msg.textContent='이번에는 색칠된 칸만 세어 보세요.';return;}
        if(counting.has(index)){msg.textContent='이미 센 칸이에요. 다른 칸을 눌러 보세요.';return;}
        counting.add(index);cell.textContent=counting.size;cell.setAttribute('aria-pressed','true');msg.textContent='';counter.textContent=`지금까지 ${counting.size}칸`;
        if(counting.size===target){const next=btn(data.phase===1?'전체를 다 셌어요 · 다음':'색칠한 부분까지 확인',()=>{data.phase++;draw();});work.append(next);}
      });
      let order=0;for(const index of counting){const cell=bar.children[index];cell.textContent=++order;cell.setAttribute('aria-pressed','true');}picture.append(bar);
      if(counting.size===target)work.append(btn(data.phase===1?'전체를 다 셌어요 · 다음':'색칠한 부분까지 확인',()=>{data.phase++;draw();}));
    }draw();
  }
  function positions(parent,data,{d=4,n=2}={},done){
    say(parent,'색칠한 위치가 달라요. 세 그림이 나타내는 분수도 서로 다를까요?');const examples=[consecutive(n),Array.from({length:n},(_,i)=>(i*2)%d),Array.from({length:n},(_,i)=>(i*2+1)%d)];
    const list=area(parent,'position-models');examples.forEach((selected,i)=>{const row=area(list);row.append(el('h3','',String.fromCharCode(65+i)),model('bar',d,selected));const result=area(row);row.append(btn('직접 세어 보기',()=>{result.replaceChildren();result.append(el('p','',`전체 ${d}부분, 색칠 ${n}부분`),fraction(n,d));}));});
    const actions=area(parent,'detective-answers');const msg=feedback(parent);function success(){data.solved=true;msg.textContent='어느 부분을 색칠했는지가 아니라 몇 부분을 나타냈는지가 중요해요.';if(!parent.querySelector('.position-result')){const result=area(parent,'reading-answer position-result');result.append(fraction(n,d),el('span','','세 그림 모두 같은 분수예요.'));done?.();}}
    actions.append(btn('서로 같아요',success),btn('서로 달라요',()=>{msg.textContent='각 그림에서 전체 칸 수와 색칠한 칸 수를 각각 세어 보세요.';}));if(data.solved)success();
  }
  function boss(parent,data,done){
    say(parent,'보스 미션 · 왜 두 그림이 모두 같은 분수일까요?');area(parent,'reading-answer').append(fraction(3,5));const list=area(parent,'position-models');list.append(model('bar',5,[0,1,2]),model('bar',5,[0,2,4]));
    const label=el('label','boss-label','내 말로 설명해 보세요.');const input=document.createElement('textarea');input.rows=3;input.setAttribute('aria-label','내 설명');input.value=data.words||'';input.addEventListener('input',()=>{data.words=input.value;});label.append(input);parent.append(label);
    const msg=feedback(parent);const reasons=area(parent,'detective-reasons');
    for(const [i,text] of ['색칠한 위치가 같아서','둘 다 전체를 5등분하고 그중 3부분을 나타내서','색깔이 같아서'].entries())reasons.append(btn(text,()=>{
      if(i!==1){msg.textContent='전체를 나눈 수와 색칠한 부분의 수를 함께 살펴보세요.';return;}
      if(!input.value.trim()){msg.textContent='먼저 내 말로 설명을 적어 보세요. 전체와 색칠한 부분을 함께 이야기해 보세요.';input.focus();return;}
      data.solved=true;msg.textContent='맞아요! 내가 쓴 설명에도 전체 5부분과 그중 3부분이 들어 있는지 확인해 보세요.';done?.();
    }));
    if(data.solved&&data.words?.trim())done?.();
  }
  function missions(parent,data){
    if(!data.tasks){const d=[4,6,8][Math.floor(Math.random()*3)],n=2+Math.floor(Math.random()*Math.min(2,d-2));data.tasks=[{d,n,shape:['bar','circle','grid'][Math.floor(Math.random()*3)]},{d:5,n:2},{d:[4,6][Math.floor(Math.random()*2)],n:3},{d:5+Math.floor(Math.random()*2),n:2,wrongD:4},{d:4,n:2},{}];data.progress=Array.from({length:6},()=>({}));data.index=0;}
    if(data.index===6){const finish=area(parent,'detective-finish');finish.append(el('h3','','🏆 분수 탐정 완료!'),el('p','','① 전체가 몇 등분되었는지 찾고'),el('p','','② 그중 몇 부분을 나타냈는지 찾는다.'));parent.append(btn('새 미션에 도전',()=>{delete data.tasks;build();}));return;}
    parent.append(el('h3','',data.index===5?'보스 미션':`미션 ${data.index+1}`));const board=area(parent);const next=btn(data.index===5?'탐정 결과 보기':'다음 미션',()=>{data.index++;build();});next.hidden=true;
    const done=()=>{next.hidden=false;};const p=data.progress[data.index],task=data.tasks[data.index];
    if(data.index===0)choices(board,p,task,done);if(data.index===1)twoTouches(board,p,task,done);if(data.index===2)shapes(board,p,task,done);if(data.index===3)repair(board,p,task,done);if(data.index===4)positions(board,p,task,done);if(data.index===5)boss(board,p,done);parent.append(next);
  }
  function build(){
    host.replaceChildren();nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));host.append(el('h2','',`3-${step+1} ${titles[step]}`));const data=states[step];
    if(step===0)choices(host,data,{d:4,n:3});if(step===1)twoTouches(host,data,{d:5,n:2});if(step===2)shapes(host,data);if(step===3)trap(host,data);if(step===4)repair(host,data);if(step===5)positions(host,data);if(step===6)missions(host,data);
    const footer=area(host,'reading-footer');if(step>0)footer.append(btn('← 이전 활동',()=>{step--;build();}));if(step<6)footer.append(btn('다음 활동 →',()=>{step++;build();}));
  }
  titles.forEach((title,i)=>{const b=btn(i===6?'탐정 미션':`3-${i+1}`,()=>{step=i;build();});b.title=title;nav.append(b);});build();
})();
