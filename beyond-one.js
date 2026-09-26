// 5단계: 같은 단위 조각을 모아 전체 1을 넘어가는 경험. 대분수는 표시하지 않습니다.
(() => {
  const host=document.querySelector('#beyond-content'),nav=document.querySelector('#beyond-steps');
  const titles=['조각을 하나씩 모으기','한 조각을 더 준다면?','직접 만들어라','1보다 큰 분수의 비밀','1을 넘었을까?','가짜 모델을 찾아라','1을 넘어 탈출하라'];
  const states=[{count:0,confirmed:false},{added:false},{selected:new Set()}, {index:0,selected:new Set(),solved:false,discovered:false},{index:0,show:false,wrong:false,solved:false},{index:0,phase:0},{count:0}];
  let step=0;
  const el=(tag,cls='',text='')=>{const e=document.createElement(tag);e.className=cls;e.textContent=text;return e;};
  const btn=(text,fn)=>{const b=el('button','',text);b.type='button';b.addEventListener('click',fn);return b;};
  const area=(parent,cls='')=>{const e=el('div',cls);parent.append(e);return e;};
  function note(text){host.append(el('p','beyond-instruction',text));}
  function frac(n,d){const f=el('span','reading-fraction');f.setAttribute('role','img');f.setAttribute('aria-label',`${d}분의 ${n}`);for(const [cls,num]of[['reading-top',n],['reading-bottom',d]]){const e=el('span',cls,String(num));e.setAttribute('aria-hidden','true');f.append(e);}return f;}
  function fractionButton(n,d,text,fn){const b=btn('',fn);b.className='fraction-action';b.setAttribute('aria-label',`${d}분의 ${n} ${text}`);b.append(frac(n,d),el('span','',text));return b;}
  const first=n=>new Set(Array.from({length:n},(_,i)=>i));
  function bars(parent,d,count,selected,onClick){
    const scroll=area(parent,'comparison-scroll'),list=area(scroll,'whole-list');list.setAttribute('role','group');list.setAttribute('aria-label','크기가 같은 전체 막대들');
    for(let row=0;row<count;row++){
      const block=area(list,'whole-block');block.append(el('p','whole-label',`${row+1}번째 전체`));const bar=area(block,'whole-bar');bar.style.setProperty('--parts',d);bar.setAttribute('role','group');bar.setAttribute('aria-label',`${row+1}번째 전체 막대`);
      for(let col=0;col<d;col++){
        const index=row*d+col,cell=el(onClick?'button':'span','whole-cell'+(selected.has(index)?' painted':''));
        if(onClick){cell.type='button';cell.setAttribute('aria-label',`${row+1}번째 전체 ${col+1}번째 칸`);cell.setAttribute('aria-pressed',String(selected.has(index)));cell.addEventListener('click',()=>onClick(index,cell));}bar.append(cell);
      }
    }return list;
  }
  function feedback(){const p=el('p','beyond-feedback');p.setAttribute('role','status');p.setAttribute('aria-live','polite');host.append(p);return p;}
  function result(n,d){const row=area(host,'reading-answer');row.append(frac(n,d));return row;}
  function construction(data,n,d,completed){
    const target=result(n,d);target.prepend(el('strong','','목표'));note('첫 번째 전체부터 왼쪽에서 오른쪽으로 이어서 색칠해 보세요. 다시 누르면 색칠이 지워져요.');
    const canvas=area(host);const msg=feedback();
    function draw(){canvas.replaceChildren();bars(canvas,d,Math.ceil(n/d),data.selected,(i)=>{data.selected.has(i)?data.selected.delete(i):data.selected.add(i);data.solved=false;msg.textContent='';next.hidden=true;draw();});}
    const check=btn('만든 분수 확인',()=>{
      if(data.selected.size!==n){msg.textContent='전체 개수가 아니라 같은 크기의 조각이 몇 개 색칠되었는지 세어 보세요.';return;}
      if(!Array.from({length:n},(_,i)=>i).every(i=>data.selected.has(i))){msg.textContent='모은 조각의 수는 맞아요. 이번에는 첫 번째 전체부터 채워볼까요? 왼쪽부터 이어서 색칠해 보세요.';return;}
      data.solved=true;msg.textContent='성공! 첫 번째 전체를 채우고도 조각이 더 이어져요.';next.hidden=false;
    });
    const next=btn('계속 관찰하기',completed);next.hidden=!data.solved;host.append(check,next);draw();if(data.solved)msg.textContent='성공! 첫 번째 전체를 채우고도 조각이 더 이어져요.';
  }
  function build(){
    host.replaceChildren();nav.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===step)));host.append(el('h2','',`5-${step+1} ${titles[step]}`));const data=states[step];
    if(step===0){
      const intro=area(host,'unit-instruction');intro.append(frac(1,4),el('span','','을 하나씩 색칠해 보세요. 두 막대는 각각 전체 1이에요.'));
      const canvas=area(host),display=area(host,'reading-answer'),actions=area(host,'beyond-actions'),question=area(host),msg=feedback();
      const add=fractionButton(1,4,'더 색칠하기',()=>{if(data.count<4){data.count++;draw();}});actions.append(add);
      function draw(){canvas.replaceChildren();bars(canvas,4,2,first(data.count));display.replaceChildren(frac(data.count,4));add.disabled=data.count===4;question.replaceChildren();msg.textContent='';
        if(data.count===4){if(data.confirmed){display.append(el('span','','= 1'));msg.textContent='한 막대를 가득 채웠어요. 전체 1이에요.';return;}
          question.append(el('h3','','첫 번째 막대가 가득 찼어요. 얼마일까요?'));const choices=area(question,'beyond-actions');for(const n of [0,1,2])choices.append(btn(`전체 ${n}`,()=>{if(n===1){data.confirmed=true;draw();}else msg.textContent='가득 찬 전체 막대가 몇 개인지 살펴보세요.';}));}
      }draw();
    }else if(step===1){
      const intro=area(host,'unit-instruction');intro.append(frac(1,4),el('span','','조각이 하나 더 생겼어요. 어디에 색칠해야 할까요?'));
      const canvas=area(host),msg=feedback();
      function draw(){canvas.replaceChildren();bars(canvas,4,2,first(data.added?5:4),(index)=>{
        if(data.added)return;
        if(index<4){msg.textContent='첫 번째 전체는 이미 꽉 찼어요. 다음 전체에서 자리를 찾아보세요.';return;}
        if(index!==4){msg.textContent='두 번째 전체의 첫 칸부터 이어서 색칠해 볼까요?';return;}
        data.added=true;build();
      });}draw();
      if(data.added){const sum=area(host,'unit-sum');for(let i=0;i<5;i++){if(i)sum.append(el('span','','+'));sum.append(frac(1,4));}sum.append(el('span','','→'),frac(5,4));const explanation=area(host,'unit-instruction');explanation.append(frac(5,4),el('span','','는 전체 1개를 가득 채우고도'),frac(1,4),el('span','','이 더 있어요.'));}
    }else if(step===2){construction(data,5,4,()=>{step=3;build();});
    }else if(step===3){
      const examples=[[3,2],[5,3],[7,4]];
      if(data.index<3){const [n,d]=examples[data.index];construction(data,n,d,()=>{data.index++;data.selected=new Set();data.solved=false;build();});}
      else{
        note('직접 만든 세 분수를 살펴보세요. 1보다 큰 분수에는 어떤 공통점이 있나요?');const row=area(host,'reading-answer');examples.forEach(([n,d])=>row.append(frac(n,d)));const msg=feedback();
        if(!data.discovered){const options=area(host,'beyond-reasons');['위 숫자가 아래 숫자보다 커요','위 숫자가 아래 숫자보다 작아요','위 숫자와 아래 숫자가 같아요'].forEach((text,i)=>options.append(btn(text,()=>{if(i===0){data.discovered=true;build();}else msg.textContent='세 분수의 위 숫자와 아래 숫자를 각각 비교해 보세요.';})));}
        else{msg.textContent='찾았어요! 1보다 큰 분수는 분자가 분모보다 커요. 분자가 분모와 같거나 큰 분수를 가분수라고 해요.';note('같은 경우도 살펴볼까요?');bars(host,4,1,first(4));const same=result(4,4);same.append(el('span','','= 1'));host.append(el('p','beyond-instruction','이 분수도 분자와 분모가 같으므로 가분수예요. 전체 1과 같고, 1보다 크지는 않아요.'));}
      }
    }else if(step===4){
      const tasks=[3,5,7];if(data.index===3){note('세 분수를 모두 판단했어요! 필요할 때는 막대를 떠올려 보세요.');host.append(btn('다시 해 보기',()=>{data.index=0;data.solved=false;data.show=false;data.wrong=false;build();}));}
      else{const n=tasks[data.index];result(n,5);note('전체 1과 비교하면 어떨까요?');const choices=area(host,'beyond-actions'),visual=area(host),msg=feedback();
        if(data.show)bars(visual,5,2,first(n));const show=btn('막대 보기',()=>{data.show=true;data.wrong=false;build();});show.hidden=!data.wrong;host.append(show);
        const next=btn(data.index===2?'판단 완료':'다음 분수',()=>{data.index++;data.show=false;data.wrong=false;data.solved=false;build();});next.hidden=!data.solved;host.append(next);
        ['1보다 작다','1과 같다','1보다 크다'].forEach((text,i)=>{const b=btn(text,()=>{if(i===data.index){data.solved=true;next.hidden=false;msg.textContent='잘 살펴봤어요! '+text+'고 판단했네요.';choices.querySelectorAll('button').forEach(c=>c.disabled=true);}else{data.wrong=true;choices.querySelectorAll('button').forEach(c=>c.disabled=true);show.hidden=false;msg.textContent='막대를 보고 전체 1을 채웠는지 살펴본 뒤 다시 판단해 보세요.';}});b.disabled=data.wrong||data.solved;choices.append(b);});}
    }else if(step===5){
      if(data.index===2){note('로봇의 두 그림을 모두 확인했어요! 전체 개수가 아니라 같은 크기의 조각 수를 세었네요.');}
      else{const d=data.index===0?4:3,n=data.index===0?5:7,claimed=data.index===0?6:7;
        const claim=area(host,'reading-answer');claim.append(el('span','','🤖 이 그림은'),frac(claimed,d),el('span','','입니다!'));bars(host,d,data.index===0?2:3,first(n));const msg=feedback();
        if(data.phase===2){const fixed=result(n,d);fixed.prepend(el('span','',data.index===0?'고친 이름':'맞는 이름'));msg.textContent=`같은 크기의 조각이 모두 ${n}개예요.`;host.append(btn(data.index===0?'다음 로봇 그림':'모델 확인 완료',()=>{data.index++;data.phase=0;build();}));}
        else if(data.phase===1){note('색칠한 조각은 모두 몇 개인가요?');const form=el('form','reading-form'),input=document.createElement('input');input.type='number';input.inputMode='numeric';input.min='0';input.max='12';input.required=true;input.setAttribute('aria-label','색칠한 조각의 총수');const submit=el('button','','조각 수 확인');submit.type='submit';form.append(input,submit);host.append(form);form.addEventListener('submit',e=>{e.preventDefault();if(Number(input.value)===n){data.phase=2;build();}else msg.textContent='한 칸을 한 조각으로 세어 보세요. 다음 전체에 있는 색칠한 칸도 함께 세어요.';});}
        else{const choices=area(host,'beyond-actions');for(const [answer,text]of[[true,'맞아요'],[false,'틀렸어요']])choices.append(btn(text,()=>{if(answer===(n===claimed)){data.phase=1;build();}else msg.textContent='색칠한 작은 조각을 처음부터 끝까지 하나씩 세어 보세요.';}));}
      }
    }else{
      const goal=area(host,'reading-answer');goal.append(el('strong','','🎯 목표'),frac(8,3));const canvas=area(host),current=area(host,'reading-answer'),milestones=area(host,'beyond-milestones'),msg=feedback();
      const add=fractionButton(1,3,'더하기',()=>{if(data.count<8){data.count++;draw();}});host.append(add);
      function draw(){canvas.replaceChildren();bars(canvas,3,3,first(data.count));current.replaceChildren(el('span','','지금까지'),frac(data.count,3));milestones.replaceChildren();for(let whole=1;whole<=Math.floor(data.count/3);whole++)milestones.append(el('p','',`🚩 전체 ${whole} 통과!`));add.disabled=data.count===8;msg.textContent=data.count===8?'🏆 탈출 성공! 전체를 다 채워도 같은 크기의 조각은 계속 이어질 수 있어요.':'';}draw();
    }
    const footer=area(host,'reading-footer');if(step>0)footer.append(btn('← 이전 활동',()=>{step--;build();}));if(step<6)footer.append(btn('다음 활동 →',()=>{step++;build();}));
  }
  titles.forEach((title,i)=>{const b=btn(`5-${i+1}`,()=>{step=i;build();});b.title=title;nav.append(b);});build();
})();
