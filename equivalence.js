// 7단계: 같은 전체와 색칠한 양을 유지하며 경계선만 다시 나누고 묶습니다.
(() => {
  const host=document.querySelector('#equivalence-content'),nav=document.querySelector('#equivalence-steps');
  const toolMessage=document.querySelector('#equivalence-tool-message'),factor=document.querySelector('#equivalence-factor');
  const titles=['먼저 예상하기','직접 만들어 확인','다시 나누기','한 번 더 나누기','겹쳐 보기','같은 분수 모두 찾기','내가 만드는 같은 분수','규칙 발견','다시 묶기','가짜 동치분수','보스 미션','자유 탐구'];
  const states=Array.from({length:12},()=>({}));let step=0,splitCount=0,overlayCount=0;
  const bases=[[1,2],[1,2],[1,2],[1,2],[2,3],[1,2],[2,3],[1,2],[6,8],[1,2],[1,3],[1,2]];
  const el=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
  const area=(p,cls='')=>{const e=el('div',cls);p.append(e);return e;};
  const button=(text,fn)=>{const b=el('button','',text);b.type='button';b.addEventListener('click',fn);return b;};
  const same=(a,b)=>Math.abs(a[0]/a[1]-b[0]/b[1])<1e-10;
  function fraction(n,d){const f=el('span','reading-fraction');f.setAttribute('role','img');f.setAttribute('aria-label',`${d}분의 ${n}`);for(const [cls,v]of[['reading-top',n],['reading-bottom',d]]){const p=el('span',cls,String(v));p.setAttribute('aria-hidden','true');f.append(p);}return f;}
  function say(p,text){p.append(el('p','eq-instruction',text));}
  function feedback(p,text=''){const e=el('p','eq-feedback',text);e.setAttribute('role','status');e.setAttribute('aria-live','polite');p.append(e);return e;}
  function equation(p,values,separator='='){const row=area(p,'eq-equation');values.forEach((v,i)=>{if(i)row.append(el('span','',separator));row.append(fraction(...v));});return row;}
  function bar(p,n,d,label='',click){
    const row=area(p,'eq-row');if(label){const head=area(row,'eq-row-title');head.append(el('span','',label),fraction(n,d));}
    const surface=el('div','eq-bar');surface.setAttribute('role',click?'group':'img');surface.setAttribute('aria-label',label?'색칠한 양을 나타낸 막대':'관찰할 막대');
    const fill=el('div','eq-fill');fill.style.width=`${n/d*100}%`;surface.append(fill);
    const grid=el('div','eq-grid');grid.style.gridTemplateColumns=`repeat(${d},minmax(0,1fr))`;
    for(let i=0;i<d;i++){const cell=el(click?'button':'span','eq-cell');if(click){cell.type='button';cell.setAttribute('aria-label',`${label} ${i+1}번째 칸`);cell.setAttribute('aria-pressed',String(i<n));cell.addEventListener('click',()=>click(i));}grid.append(cell);}surface.append(grid);row.append(surface);return row;
  }
  function aligned(p,values,guide=false,labels=true){const list=area(p,'eq-aligned');values.forEach((v,i)=>bar(list,...v,labels?`막대 ${i+1}`:''));if(guide&&values.length>1&&values.every(v=>same(v,values[0]))){const line=el('div','eq-end-guide');line.style.left=`${values[0][0]/values[0][1]*100}%`;list.append(line);}return list;}
  function overlay(p,a,b,reveal=true){
    const board=area(p,'eq-overlap');say(board,'두 막대의 왼쪽 끝과 전체 길이를 맞춰 포개요.');const canvas=area(board,'eq-overlay-canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','같은 전체에서 두 색칠한 길이를 겹친 모습');
    for(const [v,name]of[[a,'a'],[b,'b']]){const track=area(canvas,`eq-overlay-track ${name}`),fill=area(track,'eq-overlay-fill');fill.style.width=`${v[0]/v[1]*100}%`;}
    requestAnimationFrame(()=>requestAnimationFrame(()=>{if(canvas.isConnected)canvas.classList.add('merged');}));
    say(board,'파란색은 첫 번째 막대, 주황색은 두 번째 막대예요.');if(reveal){feedback(board,same(a,b)?'🎉 딱 맞아요! 색칠된 크기가 같아요.':'끝이 어긋나요. 색칠된 크기가 달라요.');equation(board,[a,b],same(a,b)?'=':'≠');}
  }
  function currentBase(){return step===10&&states[10].round===1?[3,4]:bases[step];}
  function workState(){const data=states[step];data.work??=[...currentBase()];data.history??=[[...currentBase()]];return data;}
  function operate(kind,multiple=Number(factor.value)){
    toolMessage.textContent='';if(step===0&&!states[0].prediction)return;
    const data=workState();if(kind==='overlay'){data.overlaid=true;overlayCount++;build();return;}
    const[n,d]=data.work;
    if(kind==='split'){
      if(d*multiple>60){toolMessage.textContent='이번 탐구에서는 60등분까지 살펴봐요. 처음 막대로 돌아가거나 다시 묶어 보세요.';return;}
      data.work=[n*multiple,d*multiple];splitCount++;
    }else{
      if(n%multiple!==0||d%multiple!==0||d/multiple<2){toolMessage.textContent='이 막대는 그 수만큼씩 묶으면 색칠 경계가 맞지 않아요. 다른 수나 막대를 골라 보세요.';return;}
      data.work=[n/multiple,d/multiple];
    }
    data.changed=true;data.lastAction=kind;data.overlaid=false;data.history.push([...data.work]);
    if(step===6){data.records??=new Map();if(!same(data.work,currentBase()))throw Error('양이 달라졌습니다.');if(data.work[1]!==3)data.records.set(data.work.join('/'),[...data.work]);}
    build();
  }
  document.querySelector('#eq-split').addEventListener('click',()=>operate('split'));document.querySelector('#eq-merge').addEventListener('click',()=>operate('merge'));document.querySelector('#eq-overlay').addEventListener('click',()=>operate('overlay'));
  function resetWork(){const data=states[step];data.work=[...currentBase()];data.history=[[...currentBase()]];data.changed=false;data.overlaid=false;build();}
  function lab(p,data){say(p,'조작 실험실 · 전체 길이와 색칠한 크기를 유지하며 조각을 바꿔 보세요.');aligned(p,[currentBase(),data.work],true);if(data.overlaid)overlay(p,currentBase(),data.work);p.append(button('처음 막대로',resetWork));}
  function drag(token,target,apply){let start=null,moved=false,suppress=false;token.classList.add('eq-card-token');token.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};moved=false;suppress=false;token.setPointerCapture(e.pointerId);});token.addEventListener('pointermove',e=>{if(!start||!token.hasPointerCapture(e.pointerId))return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)+Math.abs(y)>8)moved=true;if(moved){token.style.transform=`translate(${x}px,${y}px)`;token.classList.add('dragging');}});function clear(){start=null;token.style.transform='';token.classList.remove('dragging');}token.addEventListener('pointerup',e=>{if(!start)return;const r=target.getBoundingClientRect();const hit=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;suppress=moved;clear();if(token.hasPointerCapture(e.pointerId))token.releasePointerCapture(e.pointerId);if(moved&&hit)apply();});token.addEventListener('pointercancel',()=>{suppress=true;clear();});token.addEventListener('click',()=>{if(suppress){suppress=false;return;}apply();});}
  function findAll(parent,data,target,candidates,done){
    data.found??=new Set();say(parent,'같은 크기라고 생각하는 카드를 목표 막대에 올려 보세요. 눌러 넣어도 돼요.');const drop=area(parent,'eq-card-drop');equation(drop,[target]);bar(drop,...target,'목표');const cards=area(parent,'eq-cards'),inspection=area(parent),result=area(parent);
    function inspect(value,index){inspection.replaceChildren();aligned(inspection,[target,value],true);overlay(inspection,target,value);if(same(target,value))data.found.add(index);renderResult();}
    function renderResult(){result.replaceChildren();cards.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(data.found.has(i))));const expected=candidates.map((v,i)=>same(v,target)?i:-1).filter(i=>i>=0);if(expected.every(i=>data.found.has(i))){equation(result,[target,...expected.map(i=>candidates[i])]);feedback(result,'같은 크기의 분수를 모두 찾았어요!');done?.();}else say(result,`${data.found.size}개를 발견했어요. 다른 카드도 확인해 보세요.`);}
    candidates.forEach((value,i)=>{const b=button('',()=>{});b.setAttribute('aria-label',`${value[1]}분의 ${value[0]} 카드`);b.append(fraction(...value));cards.append(b);drag(b,drop,()=>inspect(value,i));});renderResult();
  }
  function build(){
    host.replaceChildren();toolMessage.textContent='';nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(step===i)));document.querySelectorAll('#equivalence-tools button').forEach(b=>b.disabled=step===0&&!states[0].prediction);host.append(el('h2','',step===11?'자유 탐구':`7-${step+1} ${titles[step]}`));const data=workState();
    if(step===0){equation(host,[[1,2],[2,4]],'와');say(host,'두 분수의 크기는 어떨까요? 먼저 예상해 보세요.');const choices=area(host,'eq-actions');for(const [value,text]of[['A','첫 번째 분수가 크다'],['B','두 번째 분수가 크다'],['same','같다']]){const b=button(text,()=>{data.prediction=value;build();});b.setAttribute('aria-pressed',String(data.prediction===value));choices.append(b);}if(data.prediction){feedback(host,'🔍 분수 막대로 확인해 볼까요? 아직 예상의 정답은 알려주지 않을게요.');host.append(button('직접 만들어 확인하기',()=>{step=1;build();}));}}
    else if(step===1){data.a??=0;data.b??=0;say(host,'각 막대의 왼쪽부터 칸을 눌러 위는 이분의 일, 아래는 사분의 이를 만들어 보세요.');const pair=area(host,'eq-aligned');const change=(key,i)=>{if(i>data[key]){toolMessage.textContent='왼쪽부터 이어서 색칠해 보세요.';return;}data[key]=i<data[key]?i:i+1;data.confirmed=false;build();};bar(pair,data.a,2,'위 막대',i=>change('a',i));bar(pair,data.b,4,'아래 막대',i=>change('b',i));if(data.a===1&&data.b===2){const line=el('div','eq-end-guide');line.style.left='50%';pair.append(line);say(host,'칸의 개수는 다른데 색칠된 부분의 크기는 어떤가요?');const actions=area(host,'eq-actions');actions.append(button('같아요',()=>{data.confirmed=true;build();}),button('달라요',()=>{toolMessage.textContent='색칠된 부분의 끝이 같은 곳에 있는지 점선을 살펴보세요.';}));if(data.confirmed)equation(host,[[1,2],[2,4]]);}}
    else if(step===2){say(host,'각 조각을 다시 2개씩 똑같이 나눠 보세요.');host.append(button('다시 나누기 ×2',()=>operate('split',2)));bar(host,...data.work,'현재 막대');if(data.changed){equation(host,[data.history[data.history.length-2],data.work],'→');say(host,'무엇이 달라지고, 무엇이 그대로일까요?');host.append(button('조각 수는 달라져도 색칠된 전체 크기는 같아요',()=>{data.noticed=true;build();}));if(data.noticed)feedback(host,'맞아요! 전체와 색칠한 길이는 그대로이고, 나눈 선만 늘었어요.');}if(data.overlaid)overlay(host,[1,2],data.work);}
    else if(step===3){say(host,'한 번 더 2개씩 나누며 이전 막대와 나란히 살펴보세요.');host.append(button('한 번 더 나누기 ×2',()=>operate('split',2)));const unique=[...new Map(data.history.map(v=>[v.join('/'),v])).values()];aligned(host,unique,true);if(unique.length>=3)equation(host,unique);if(data.overlaid)overlay(host,[1,2],data.work);}
    else if(step===4){data.variant??=0;const pair=data.variant===0?[[2,3],[4,6]]:[[2,3],[3,5]];say(host,'숫자 대신 색칠된 길이를 겹쳐 확인해 보세요.');const actions=area(host,'eq-actions');actions.append(button('같은 크기 확인',()=>{data.variant=0;data.overlaid=false;build();}),button('다른 두 분수도 확인',()=>{data.variant=1;data.overlaid=false;build();}));aligned(host,pair);if(data.overlaid)overlay(host,...pair);if(data.changed)lab(host,data);}
    else if(step===5)findAll(host,data,[1,2],[[2,3],[2,4],[3,6],[4,6],[4,8],[5,10]]);
    else if(step===6){say(host,'삼분의 이와 같은 크기의 새 막대를 만들어 보세요.');bar(host,2,3,'기준 막대');if(data.changed)bar(host,...data.work,'새로 만든 막대');else say(host,'아래에 만들 막대는 아직 비어 있어요. 다시 나누기로 시작하세요.');const actions=area(host,'eq-actions');actions.append(button('다시 나누기 ×2',()=>operate('split',2)),button('다시 나누기 ×3',()=>operate('split',3)),button('기준 막대로 돌아가기',resetWork));if(data.records?.size){host.append(el('h3','','🔬 내가 발견한 같은 크기의 분수'));for(const value of data.records.values())equation(host,[[2,3],value]);}if(data.overlaid)overlay(host,[2,3],data.work);}
    else if(step===7){
      if(splitCount<2||overlayCount<1){say(host,'먼저 다시 나누기를 두 번 이상 하고, 겹쳐보기로 크기를 확인해 보세요.');host.append(button('나누기 탐구로',()=>{step=2;build();}));if(data.changed||data.overlaid)lab(host,data);}
      else{data.phase??=0;const rows=[[[1,2],[2,4],2],[[2,3],[6,9],3]];if(data.phase<4){const [from,to,m]=rows[Math.floor(data.phase/2)];equation(host,[from,to],'→');say(host,data.phase%2===0?'분자는 어떻게 변했나요?':'분모는 어떻게 변했나요?');const actions=area(host,'eq-actions');for(const v of [2,3,4])actions.append(button(`×${v}`,()=>{if(v===m){data.phase++;build();}else toolMessage.textContent='바뀌기 전과 후의 숫자를 비교해 보세요.';}));}
        else{for(const [from,to,m]of rows){equation(host,[from,to],'→');const marks=area(host,`eq-multipliers factor-${m}`);marks.append(el('span','',`분자 ×${m}`),el('span','',`분모 ×${m}`));}say(host,'어떤 규칙이 있나요?');host.append(button('분자와 분모에 같은 수를 곱했어요',()=>{data.rule=true;build();}),button('분자만 바뀌었어요',()=>{toolMessage.textContent='위 숫자와 아래 숫자를 함께 살펴보세요.';}));if(data.rule)feedback(host,'분자와 분모에 같은 수를 곱하면 분수의 크기는 변하지 않습니다.');}}
    }else if(step===8){say(host,'두 칸씩 하나로 묶어볼까요? 경계선이 줄어도 색칠한 길이가 같은지 보세요.');bar(host,...data.work,'현재 막대');host.append(button('두 칸씩 다시 묶기',()=>operate('merge',2)));if(data.changed){equation(host,[[6,8],data.work]);feedback(host,'잘게 나눈 조각을 다시 묶어도 같은 크기로 나타낼 수 있네요.');}if(data.overlaid)overlay(host,[6,8],data.work);}
    else if(step===9){say(host,'🤖 로봇은 두 분수의 크기가 같다고 했어요. 정말 그럴까요?');equation(host,[[1,2],[2,3]]);host.append(button('막대로 확인',()=>{data.overlaid=true;overlayCount++;build();}));if(data.overlaid){aligned(host,[[1,2],[2,3]]);overlay(host,[1,2],[2,3]);say(host,'로봇은 무엇을 잘못했을까요?');['분자와 분모에 같은 수를 적용하지 않았다','분수가 두 개라서','색깔이 달라서'].forEach((text,i)=>host.append(button(text,()=>{if(i===0){data.correct=true;build();}else toolMessage.textContent='나눈 수와 색칠한 수가 어떻게 바뀌었는지 살펴보세요.';})));if(data.correct)feedback(host,'맞아요. 위 숫자와 아래 숫자에 같은 수를 적용하지 않았고, 실제 색칠한 크기도 달라요.');}}
    else if(step===10)boss(host,data);
    else freeExplore(host);
    if(step===0&&data.prediction&&(data.changed||data.overlaid)){aligned(host,[[1,2],data.work]);if(data.overlaid)overlay(host,[1,2],data.work,false);}
    if(step===1&&data.overlaid)overlay(host,[data.a,2],[data.b,4],false);
    if(([1,9].includes(step)&&data.changed)||([5,10,11].includes(step)&&(data.changed||data.overlaid))||(step===7&&splitCount>=2&&overlayCount>=1&&(data.changed||data.overlaid)))lab(host,data);
    const footer=area(host,'reading-footer');if(step>0)footer.append(button('← 이전 활동',()=>{step--;build();}));if(step<10)footer.append(button('다음 활동 →',()=>{step++;build();}));
  }
  function numberInput(label){const i=document.createElement('input');i.type='number';i.min='1';i.max='60';i.step='1';i.required=true;i.inputMode='numeric';i.setAttribute('aria-label',label);return i;}
  function boss(parent,data){
    data.round??=0;data.tasks??=Array.from({length:5},()=>({}));const task=data.tasks[data.round];
    if(data.round===5){feedback(parent,'🏆 같은 크기 탐구 완료! 조각을 다시 나누거나 묶어도 전체와 색칠한 크기는 유지할 수 있어요.');return;}
    parent.append(el('h3','',`미션 ${data.round+1}`));const next=button(data.round===4?'탐구 완료':'다음 미션',()=>{data.round++;data.work=null;data.history=null;data.changed=false;data.overlaid=false;build();});next.hidden=!task.solved;
    if(data.round<=1){const from=data.round===0?[1,3]:[3,4],to=data.round===0?[null,6]:[6,null];equation(parent,[from,to.map(v=>v===null?'□':v)]);say(parent,'다시 나누기로 막대를 바꿔 빈칸을 찾아보세요.');bar(parent,...data.work,'조작 막대');const form=el('form','reading-form'),input=numberInput('빈칸의 숫자'),submit=el('button','','빈칸 확인');submit.type='submit';form.append(input,submit);parent.append(form);const msg=feedback(parent);form.addEventListener('submit',e=>{e.preventDefault();if(!data.changed){msg.textContent='먼저 다시 나누기로 직접 확인해 보세요.';return;}if(Number(input.value)===(data.round===0?2:8)){task.solved=true;next.hidden=false;msg.textContent='모델과 숫자를 연결했어요!';}else msg.textContent='새 막대의 전체 칸 수와 색칠한 칸 수를 살펴보세요.';});}
    else if(data.round===2)findAll(parent,task,[2,5],[[4,10],[3,10],[6,15],[8,20]],()=>{task.solved=true;next.hidden=false;});
    else if(data.round===3){task.chosen??=new Set();say(parent,'분수 기호 없이 그림만 보고 목표와 같은 크기를 모두 고르세요.');bar(parent,2,4);const cards=area(parent,'eq-model-cards'),msg=feedback(parent);[[3,6],[3,4],[4,8]].forEach((v,i)=>{const b=button('',()=>{task.chosen.has(i)?task.chosen.delete(i):task.chosen.add(i);b.setAttribute('aria-pressed',String(task.chosen.has(i)));next.hidden=true;task.solved=false;msg.textContent='';});b.setAttribute('aria-label',`그림 ${i+1}`);b.setAttribute('aria-pressed',String(task.chosen.has(i)));bar(b,...v);cards.append(b);});parent.append(button('그림 선택 확인',()=>{if(task.chosen.size===2&&task.chosen.has(0)&&task.chosen.has(2)){task.solved=true;next.hidden=false;msg.textContent='색칠한 크기가 같은 그림을 찾았어요!';}else msg.textContent='전체 길이를 기준으로 색칠된 부분의 끝을 비교해 보세요.';}));}
    else{aligned(parent,[[2,3],[4,6]],true);say(parent,'왜 두 분수의 크기가 같을까요?');const msg=feedback(parent);for(const [i,text]of['각 조각을 2개씩 나누면 전체 6부분 중 4부분이 색칠되지만, 색칠한 크기는 변하지 않아서','색칠한 조각 수가 늘면 항상 크기가 커져서','분모만 달라져서'].entries())parent.append(button(text,()=>{if(i===0){task.solved=true;next.hidden=false;msg.textContent='맞아요! 조각 수와 표현은 바뀌어도 같은 양이에요.';}else msg.textContent='칸의 개수와 실제 색칠한 크기를 구분해서 살펴보세요.';}));}
    parent.append(next);
  }
  let freePanel;
  function freeExplore(parent){if(!freePanel){freePanel=el('div');say(freePanel,'직접 색칠해 같은 크기의 분수를 만드는 자유 탐구예요.');const scroll=area(freePanel,'comparison-scroll'),list=area(scroll,'has-copies eq-free-bars'),rows=[],answer=area(freePanel);function update(){answer.replaceChildren();if(!rows.length||rows[0].fractionValue()===0)return;const found=rows.filter(r=>Math.abs(r.fractionValue()-rows[0].fractionValue())<1e-10);if(found.length<2)return;equation(answer,found.map(r=>{const p=r.fractionParts();return[p.numerator,p.denominator];}));say(answer,'왜 두 분수의 크기가 같을까요?');}function add(d){rows.push(createBar(d,[],false,null,{name:rows.length?`탐구 막대 ${rows.length}`:'기준 분수',target:list,onChange:update}));update();}add(2);add(4);freePanel.append(button('빈 막대 추가',()=>add(rows[0].fractionParts().denominator)));}parent.append(freePanel);}
  titles.forEach((title,i)=>{const b=button(i===10?'보스 미션':i===11?'자유 탐구':`7-${i+1}`,()=>{step=i;build();});b.title=title;nav.append(b);});build();
})();

