// 6단계: 단위 조각을 묶고 풀면서 같은 양의 두 표현을 발견합니다.
(() => {
  const host=document.querySelector('#grouping-content'),nav=document.querySelector('#grouping-steps');
  const titles=['조각을 모아 전체 만들기','전체와 남은 부분','막대를 묶어라','전체를 조각으로 풀어라','묶기 ↔ 풀기','묶으며 발견한 규칙','잘못 묶은 로봇','양방향 보스 미션'];
  const states=Array.from({length:8},()=>({})),records=new Map();let step=0;
  const make=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
  const area=(parent,cls='')=>{const e=make('div',cls);parent.append(e);return e;};
  const button=(text,fn)=>{const b=make('button','',text);b.type='button';b.addEventListener('click',fn);return b;};
  function say(parent,text){parent.append(make('p','grouping-instruction',text));}
  function feedback(parent){const e=area(parent,'grouping-feedback');e.setAttribute('role','status');e.setAttribute('aria-live','polite');return e;}
  function fraction(n,d){const f=make('span','reading-fraction');f.setAttribute('role','img');f.setAttribute('aria-label',`${d}분의 ${n}`);for(const [cls,value]of[['reading-top',n],['reading-bottom',d]]){const p=make('span',cls,String(value));p.setAttribute('aria-hidden','true');f.append(p);}return f;}
  function mixed(w,r,d){const m=make('span','mixed-number');m.setAttribute('role','img');m.setAttribute('aria-label',`${w}과 ${d}분의 ${r}`);const whole=make('span','mixed-whole',String(w));whole.setAttribute('aria-hidden','true');const f=fraction(r,d);f.setAttribute('aria-hidden','true');m.append(whole,f);return m;}
  function equation(parent,n,d,reverse=false){const w=Math.floor(n/d),r=n%d,row=area(parent,'reading-answer');row.append(reverse?mixed(w,r,d):fraction(n,d),make('span','','='),reverse?fraction(n,d):mixed(w,r,d));}
  function input(label,max=30){const e=document.createElement('input');e.type='number';e.inputMode='numeric';e.min='0';e.max=String(max);e.step='1';e.required=true;e.setAttribute('aria-label',label);return e;}
  function askNumber(parent,label,expected,correct){const form=make('form','grouping-form'),field=input(label);form.append(make('label','',label),field);const submit=make('button','','답 확인');submit.type='submit';form.append(submit);parent.append(form);const msg=feedback(parent);form.addEventListener('submit',e=>{e.preventDefault();if(Number(field.value)===expected)correct();else msg.textContent='그림에서 완성된 전체와 남은 작은 조각을 각각 다시 세어 보세요.';});}
  function unit(d,index,interactive=false){const piece=make(interactive?'button':'span','group-unit');piece.style.width=`${300/d}px`;piece.dataset.unit=String(index);piece.append(fraction(1,d));if(interactive){piece.type='button';piece.setAttribute('aria-label',`조각 ${index+1} 묶음에 넣기`);}return piece;}
  function whole(parent,d,filled,label,click){const row=area(parent,'group-whole-row');row.append(make('p','',label));const strip=make(click?'button':'div','group-whole');if(click){strip.type='button';strip.setAttribute('aria-label',label+' 풀기');strip.addEventListener('click',click);}for(let i=0;i<d;i++)strip.append(make('span',i<filled?'filled':''));strip.style.setProperty('--parts',d);row.append(strip);return row;}
  function quantity(parent,n,d){const list=area(parent,'group-wholes');for(let i=0;i<Math.ceil(n/d);i++)whole(list,d,Math.min(d,n-i*d),`${i+1}번째 전체`);}
  function wireDrag(token,target,apply){let start=null,moved=false,suppress=false;
    token.addEventListener('pointerdown',e=>{start={x:e.clientX,y:e.clientY};moved=false;suppress=false;token.setPointerCapture(e.pointerId);});
    token.addEventListener('pointermove',e=>{if(!start||!token.hasPointerCapture(e.pointerId))return;const x=e.clientX-start.x,y=e.clientY-start.y;if(Math.abs(x)+Math.abs(y)>8)moved=true;if(moved){token.style.transform=`translate(${x}px,${y}px)`;token.classList.add('dragging');target.classList.add('drop-ready');}});
    function clear(){start=null;token.style.transform='';token.classList.remove('dragging');target.classList.remove('drop-ready');}
    token.addEventListener('pointerup',e=>{if(!start)return;const r=target.getBoundingClientRect(),hit=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;suppress=moved;clear();if(token.hasPointerCapture(e.pointerId))token.releasePointerCapture(e.pointerId);if(moved&&hit)apply();});
    token.addEventListener('pointercancel',()=>{suppress=true;clear();});token.addEventListener('click',()=>{if(suppress){suppress=false;return;}apply();});
  }
  // 각 조각의 고유 번호를 보관해 중복 투입과 조각 유실을 방지합니다.
  function grouping(parent,data,n,d,onComplete){
    data.groups??=[];data.pending??=[];const canvas=area(parent);function draw(){canvas.replaceChildren();const used=new Set([...data.groups.flat(),...data.pending]);const remaining=Array.from({length:n},(_,i)=>i).filter(i=>!used.has(i));const done=data.groups.length===Math.floor(n/d);
      const pool=area(canvas,'group-pool');pool.setAttribute('aria-label','남은 단위 조각');
      const drop=area(canvas,'group-drop');drop.setAttribute('role','group');drop.setAttribute('aria-label','조각 묶음 상자');
      say(drop,done?`전체 ${data.groups.length}개를 만들고 ${n%d}조각이 남았어요.`:`여기에 ${d}조각을 모아 보세요. (${data.pending.length}개 모음)`);
      const pending=area(drop,'joined-units');data.pending.forEach(i=>pending.append(unit(d,i)));
      remaining.forEach(i=>{const token=unit(d,i,!done);pool.append(token);if(!done)wireDrag(token,drop,()=>{if(data.groups.flat().includes(i)||data.pending.includes(i))return;data.pending.push(i);if(data.pending.length===d){data.groups.push([...data.pending]);data.pending=[];}draw();});});
      const complete=area(canvas,'completed-groups');data.groups.forEach((group,i)=>{const row=area(complete);row.append(make('p','',`🎉 전체 ${i+1} 완성!`));const joined=area(row,'joined-units');group.forEach(id=>joined.append(unit(d,id)));});
      if(done){records.set(`${n}/${d}`,{n,d});onComplete?.();}
    }draw();
  }
  function unpack(parent,data,n,d,onComplete,{showEquation=true}={}){
    data.open??=new Set();const w=Math.floor(n/d),r=n%d,canvas=area(parent);function draw(){canvas.replaceChildren();for(let i=0;i<w;i++){
      if(data.open.has(i)){const row=area(canvas);row.append(make('p','',`${i+1}번째 전체에서 나온 조각`));const chips=area(row,'loose-units');for(let j=0;j<d;j++)chips.append(unit(d,i*d+j));}
      else whole(canvas,d,d,`${i+1}번째 전체`,()=>{data.open.add(i);draw();});}
      if(r){const row=area(canvas);row.append(make('p','','남은 조각'));const chips=area(row,'loose-units');for(let i=0;i<r;i++)chips.append(unit(d,w*d+i));}
      if(data.open.size===w){say(canvas,`${Array(w).fill(d).concat(r?[r]:[]).join(' + ')} = ${n}`);if(showEquation)equation(canvas,n,d,true);onComplete?.();}
    }draw();
  }
  function build(){host.replaceChildren();nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(step===i)));host.append(make('h2','',`6-${step+1} ${titles[step]}`));const data=states[step];
    if(step===0){say(host,'같은 크기의 조각 7개예요. 세 조각을 상자로 끌어 모으면 무엇이 될까요? 조각을 눌러 넣어도 돼요.');const task=area(host),summary=area(host);grouping(task,data,7,3,()=>{summary.replaceChildren();say(summary,'전체 2개를 만들었어요. 작은 조각 하나가 남았네요!');});
    }else if(step===1){data.phase??=0;area(host,'reading-answer').append(fraction(7,3));quantity(host,7,3);
      if(data.phase===0)askNumber(host,'완성된 전체는 몇 개인가요?',2,()=>{data.phase=1;build();});
      else if(data.phase===1){say(host,'전체 2개를 찾았어요. 남은 부분은 얼마인가요?');const form=make('form','grouping-form'),f=make('span','reading-fraction'),num=input('남은 부분의 위 숫자',2),den=make('span','reading-bottom','3');num.className='reading-top';f.append(num,den);const submit=make('button','','남은 부분 확인');submit.type='submit';form.append(f,submit);host.append(form);const msg=feedback(host);form.addEventListener('submit',e=>{e.preventDefault();if(Number(num.value)===1){data.phase=2;build();}else msg.textContent='마지막 막대의 색칠한 작은 조각을 세어 보세요.';});}
      else{const join=area(host,'reading-answer mixed-join');join.append(make('span','mixed-whole','2'),make('span','','+'),fraction(1,3),make('span','','→'),mixed(2,1,3));say(host,'전체 2개와 삼분의 일이에요. 전체의 수와 남은 분수를 함께 쓴 수를 대분수라고 해요.');equation(host,7,3);}
    }else if(step===2){data.index??=0;data.work??={};const tasks=[[11,4],[5,2],[8,3],[13,5]];
      if(data.index===tasks.length){say(host,'서로 다른 크기의 조각도 전체로 묶어 보았어요!');host.append(button('처음부터 다시 묶기',()=>{data.index=0;data.work={};build();}));}
      else{const[n,d]=tasks[data.index];area(host,'reading-answer').append(fraction(n,d));say(host,`작은 조각 ${d}개씩 상자에 넣어 전체를 만들어 보세요.`);const task=area(host),summary=area(host),next=button('다음 조각 묶기',()=>{data.index++;data.work={};build();});next.hidden=true;host.append(next);grouping(task,data.work,n,d,()=>{summary.replaceChildren();say(summary,`전체 ${Math.floor(n/d)}개, 남은 조각 ${n%d}개`);equation(summary,n,d);next.hidden=false;});}
    }else if(step===3){area(host,'reading-answer').append(mixed(2,1,3));say(host,'완성된 전체 막대를 눌러 작은 조각으로 풀어 보세요. 조각은 모두 몇 개일까요?');unpack(host,data,7,3);
    }else if(step===4){data.index??=0;data.packed??=false;const tasks=[[7,3],[11,4],[8,3],[13,5]],controls=area(host,'grouping-actions');tasks.forEach(([n,d],i)=>{const b=button('',()=>{data.index=i;data.packed=false;build();});b.append(fraction(n,d));b.setAttribute('aria-label',`${d}분의 ${n} 선택`);b.setAttribute('aria-pressed',String(i===data.index));controls.append(b);});const[n,d]=tasks[data.index];const label=area(host,'reading-answer'),canvas=area(host),actions=area(host,'grouping-actions');
      function draw(){const before=new Map([...canvas.querySelectorAll('[data-unit]')].map(e=>[e.dataset.unit,e.getBoundingClientRect()]));canvas.replaceChildren();label.replaceChildren(data.packed?mixed(Math.floor(n/d),n%d,d):fraction(n,d));
        if(data.packed){for(let i=0;i<Math.floor(n/d);i++){const row=area(canvas,'joined-units');for(let j=0;j<d;j++)row.append(unit(d,i*d+j));}const left=area(canvas,'loose-units');for(let i=Math.floor(n/d)*d;i<n;i++)left.append(unit(d,i));}
        else{const loose=area(canvas,'loose-units');for(let i=0;i<n;i++)loose.append(unit(d,i));}
        if(!matchMedia('(prefers-reduced-motion: reduce)').matches)canvas.querySelectorAll('[data-unit]').forEach(e=>{const old=before.get(e.dataset.unit),now=e.getBoundingClientRect();if(old)e.animate([{transform:`translate(${old.x-now.x}px,${old.y-now.y}px)`},{transform:'translate(0,0)'}],{duration:550,easing:'ease-out'});});
        pack.disabled=data.packed;release.disabled=!data.packed;
      }
      const pack=button('🧩 묶어 보기',()=>{data.packed=true;draw();}),release=button('💥 풀어 보기',()=>{data.packed=false;draw();});actions.append(pack,release);draw();say(host,'조각 수와 조각 크기는 그대로예요. 같은 양을 다르게 나타냈어요.');
    }else if(step===5){say(host,'직접 묶어 확인한 결과만 기록해 두었어요. 빈 결과가 있다면 아래에서 더 묶어 보세요.');const table=area(host,'grouping-table-wrap');
      function drawTable(){table.replaceChildren();const t=document.createElement('table');t.innerHTML='<thead><tr><th>처음 분수</th><th>전체</th><th>남은 부분</th><th>대분수</th></tr></thead>';const body=document.createElement('tbody');for(const {n,d}of records.values()){const row=document.createElement('tr');for(const value of [fraction(n,d),make('span','',String(Math.floor(n/d))),fraction(n%d,d),mixed(Math.floor(n/d),n%d,d)]){const cell=document.createElement('td');cell.append(value);row.append(cell);}body.append(row);}t.append(body);table.append(t);if(!records.size)say(table,'아직 기록이 없어요. 조각을 직접 묶어 기록을 만들어 보세요.');}drawTable();
      const choices=area(host,'grouping-actions'),practice=area(host),question=area(host);for(const[n,d]of[[7,3],[8,3],[11,4],[13,5]]){const b=button('',()=>{data.practice={};practice.replaceChildren();grouping(practice,data.practice,n,d,()=>{drawTable();showQuestion();});});b.append(fraction(n,d),make('span','','묶기'));b.setAttribute('aria-label',`${d}분의 ${n} 묶기`);choices.append(b);}
      function showQuestion(){question.replaceChildren();if(records.size<2){say(question,'두 가지 이상 묶어 보고 규칙을 찾아보세요.');return;}say(question,'분모만큼씩 묶으면 어떤 규칙이 보이나요?');const msg=feedback(question);question.append(button('완성된 묶음은 전체 수, 남은 조각은 남은 분자가 돼요',()=>{data.discovered=true;reveal();}),button('조각 크기도 바뀌어요',()=>msg.textContent='묶기 전과 후의 작은 조각 크기가 달라졌나요? 다시 살펴보세요.'));function reveal(){msg.textContent='맞아요! 분모는 조각의 크기를 나타내므로 그대로예요.';if(!question.querySelector('.calculation-link')){const calc=button('계산과 연결해 보기',()=>{const {n,d}=records.values().next().value;const formula=make('p','',`${n} ÷ ${d} = ${Math.floor(n/d)} … ${n%d} · 몫은 전체 묶음 수, 나머지는 남은 조각 수예요.`);question.append(formula);calc.disabled=true;});calc.className='calculation-link';question.append(calc);}}if(data.discovered)reveal();}showQuestion();
    }else if(step===6){data.index??=0;data.phase??=0;data.work??={};
      if(data.index===2)say(host,'로봇의 두 실수를 고쳤어요! 전체를 묶고 풀며 조각 수를 확인했어요.');
      else if(data.index===0){say(host,'로봇이 전체의 수를 제대로 세었을까요?');const claim=area(host,'reading-answer');claim.append(fraction(8,3),make('span','','='),mixed(3,2,3));quantity(host,8,3);
        if(data.phase===0)askNumber(host,'완성된 전체는 몇 개인가요?',2,()=>{data.phase=1;build();});else if(data.phase===1)askNumber(host,'남은 작은 조각은 몇 개인가요?',2,()=>{data.phase=2;build();});else{say(host,'전체는 3개가 아니라 2개예요!');equation(host,8,3);host.append(button('다음 로봇',()=>{data.index=1;data.phase=0;build();}));}
      }else{say(host,'로봇은 이렇게 말했어요. 전체를 풀어 직접 확인해 보세요.');const claim=area(host,'reading-answer');claim.append(mixed(2,3,4),make('span','','='),fraction(7,4));const task=area(host),answer=area(host);unpack(task,data.work,11,4,()=>{answer.replaceChildren();if(data.phase===1){equation(answer,11,4,true);answer.append(button('로봇 수정 완료',()=>{data.index=2;build();}));}else askNumber(answer,'작은 조각은 모두 몇 개인가요?',11,()=>{data.phase=1;build();});},{showEquation:false});}
    }else boss(data);
    const footer=area(host,'reading-footer');if(step>0)footer.append(button('← 이전 활동',()=>{step--;build();}));if(step<7)footer.append(button('다음 활동 →',()=>{step++;build();}));
  }
  function boss(data){
    const pick=xs=>xs[Math.floor(Math.random()*xs.length)];data.tasks??=[pick([[10,3],[13,4],[11,3]]),pick([[12,5],[11,4],[8,3]]),pick([[10,4],[11,4],[8,3]])];data.round??=0;data.work??={};
    if(data.round===3){say(host,'🏆 전체 묶기·풀기 완료! 조각의 양은 그대로 두고 두 가지 모습으로 나타냈어요. 약분하지 않고 원래 조각 크기를 지켰어요.');host.append(button('새 보스 미션',()=>{data.tasks=null;data.round=0;data.work={};build();}));return;}
    const[n,d]=data.tasks[data.round],w=Math.floor(n/d),r=n%d;host.append(make('h3','',`ROUND ${data.round+1}`));
    const next=button(data.round===2?'보스 미션 완료':'다음 라운드',()=>{data.round++;data.work={};build();});next.hidden=true;
    if(data.round===0){area(host,'reading-answer').append(fraction(n,d));say(host,'직접 묶어서 전체와 남은 부분을 찾아보세요.');const task=area(host),answer=area(host);grouping(task,data.work,n,d,()=>{answer.replaceChildren();equation(answer,n,d);next.hidden=false;});}
    else if(data.round===1){area(host,'reading-answer').append(mixed(w,r,d));say(host,'전체를 작은 조각으로 풀고 조각 수를 입력해 보세요.');const task=area(host),answer=area(host);unpack(task,data.work,n,d,()=>{answer.replaceChildren();askNumber(answer,'작은 조각은 모두 몇 개인가요?',n,()=>{answer.replaceChildren();equation(answer,n,d,true);next.hidden=false;});},{showEquation:false});}
    else{say(host,'그림을 두 가지 분수로 나타내세요. 지금 나눈 조각 크기를 그대로 사용해요.');quantity(host,n,d);const form=make('form','grouping-form boss-mixed-form');const improper=make('span','reading-fraction'),ni=input('가분수의 분자'),di=input('가분수의 분모');ni.className='reading-top';di.className='reading-bottom';improper.append(ni,di);const mix=make('span','mixed-number'),wi=input('대분수의 전체 수'),rest=make('span','reading-fraction'),ri=input('남은 부분의 분자'),rd=input('남은 부분의 분모');ri.className='reading-top';rd.className='reading-bottom';rest.append(ri,rd);mix.append(wi,rest);const check=make('button','','두 표현 확인');check.type='submit';form.append(improper,make('span','','='),mix,check);host.append(form);const msg=feedback(host);form.addEventListener('submit',e=>{e.preventDefault();if([ni,di,wi,ri,rd].map(x=>Number(x.value)).every((x,i)=>x===[n,d,w,r,d][i])){msg.textContent='두 표현 모두 맞아요! 같은 양을 다르게 나타냈어요.';next.hidden=false;}else{next.hidden=true;msg.textContent='전체 묶음 수, 남은 조각 수, 처음 나눈 조각 크기를 다시 확인해 보세요. 아직 약분하지 않아요.';}});form.addEventListener('input',()=>{next.hidden=true;msg.textContent='';});}
    host.append(next);
  }
  titles.forEach((title,i)=>{const b=button(i===7?'보스 미션':`6-${i+1}`,()=>{step=i;build();});b.title=title;nav.append(b);});build();
})();
