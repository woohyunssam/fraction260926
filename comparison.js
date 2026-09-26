// 4단계: 같은 전체를 기준으로 예상 → 겹치기 → 다시 판단합니다.
(() => {
  const host=document.querySelector('#comparison-content');
  const navigation=document.querySelector('#comparison-steps');
  const lessons=[
    {title:'나눈 수가 같다면?',text:'둘 다 전체를 5등분했어요. 같은 크기의 조각이 몇 개 색칠되었는지 살펴보세요.',a:[5,[0]],b:[5,[0,1,2]],fixed:true},
    {title:'한 조각씩 비교하면?',text:'각 막대에서 한 조각씩 비교해요. 분모를 바꾸면 한 조각의 크기가 어떻게 달라질까요?',a:[2,[0]],b:[4,[0]],single:true},
    {title:'겹쳐 확인하기',text:'색칠한 위치가 달라도 같은 양일까요? 먼저 예상하고, 왼쪽부터 모아 겹쳐 보세요.',a:[2,[1]],b:[4,[0,2]]},
    {title:'자유 비교',text:'분모와 색칠을 자유롭게 바꾸고 비교해 보세요. 두 막대의 전체 길이는 항상 같아요.',a:[2,[]],b:[3,[]]}
  ];
  const pages=[];
  const make=(tag,cls='',text='')=>{const el=document.createElement(tag);el.className=cls;el.textContent=text;return el;};
  function button(text,action){const b=make('button','',text);b.type='button';b.addEventListener('click',action);return b;}
  function createLesson(lesson,index){
    const page=make('div','comparison-lesson');page.hidden=true;page.setAttribute('role','region');page.setAttribute('aria-label',`4-${index+1} ${lesson.title}`);
    page.append(make('h2','',`4-${index+1} ${lesson.title}`),make('p','comparison-intro',lesson.text));
    const scroll=make('div','comparison-scroll'),surface=make('div','comparison-surface'),bars=make('div','has-copies');scroll.append(surface);surface.append(bars);page.append(scroll);
    const overlay=make('div','comparison-overlay');overlay.hidden=true;surface.append(overlay);
    const quiz=make('div','comparison-quiz');page.append(quiz);
    const question=make('div');question.hidden=true;const title=make('h3','','어느 분수가 더 클까요?');title.tabIndex=-1;question.append(title);
    const choices=make('div','comparison-actions');question.append(choices);
    const feedback=make('p','comparison-feedback');feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');
    const tools=make('div','comparison-actions');let needsRetry=false;
    const compare=button('비교하기',()=>{compare.hidden=true;feedback.textContent='';question.hidden=false;choices.hidden=false;retry.hidden=true;needsRetry=false;choices.querySelectorAll('button').forEach(b=>b.disabled=false);overlap.hidden=false;title.focus({preventScroll:true});});
    const retry=button('다시 판단하기',()=>{choices.hidden=false;retry.hidden=true;feedback.textContent='겹친 그림을 보고 다시 골라 보세요.';title.focus({preventScroll:true});});retry.hidden=true;
    const overlap=button('왼쪽부터 모아 겹쳐보기',()=>{showOverlay();if(needsRetry)retry.hidden=false;});overlap.hidden=true;
    tools.append(overlap,retry);quiz.append(compare,question,feedback,tools);
    function reset(){compare.hidden=false;question.hidden=true;choices.hidden=false;feedback.textContent='';overlay.hidden=true;overlay.replaceChildren();overlap.hidden=true;retry.hidden=true;needsRetry=false;choices.querySelectorAll('button').forEach(b=>b.disabled=false);}
    const a=createBar(lesson.a[0],lesson.a[1],false,null,{name:'분수 A',target:bars,onChange:reset,singlePiece:!!lesson.single});
    const b=createBar(lesson.b[0],lesson.b[1],false,null,{name:'분수 B',target:bars,onChange:reset,singlePiece:!!lesson.single});
    if(lesson.fixed){for(const row of [a,b]){const label=row.querySelector('label');label.hidden=true;row.querySelector('select').disabled=true;}}
    function showOverlay(){
      overlay.replaceChildren();overlay.hidden=false;
      overlay.append(make('p','','색칠한 양은 그대로 두고 왼쪽부터 모았어요. 두 막대의 시작점과 전체 길이를 맞춰 포개 보세요.'));
      const legend=make('p','overlap-legend','파란색: 분수 A · 주황색: 분수 B');overlay.append(legend);
      const canvas=make('div','overlap-canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label','전체 길이가 같은 두 막대의 색칠한 양을 왼쪽 끝에 맞춰 겹친 그림');
      for(const [row,name] of [[a,'a'],[b,'b']]){
        const track=make('div',`overlap-track track-${name}`),fill=make('div','overlap-fill');fill.style.width=`${row.fractionValue()*100}%`;track.append(fill);canvas.append(track);
      }
      overlay.append(canvas);requestAnimationFrame(()=>requestAnimationFrame(()=>{if(canvas.isConnected)canvas.classList.add('merged');}));
    }
    for(const [value,label] of [['A','분수 A가 크다'],['B','분수 B가 크다'],['equal','같다']])choices.append(button(label,()=>{
      const av=a.fractionValue(),bv=b.fractionValue();const correct=Math.abs(av-bv)<1e-10?'equal':av>bv?'A':'B';
      if(value!==correct){
        feedback.textContent='두 막대의 전체 크기와 색칠된 부분을 다시 비교해 보세요. 겹쳐본 뒤 다시 판단해 보세요.';
        choices.hidden=true;needsRetry=true;retry.hidden=overlay.hidden;overlap.hidden=false;return;
      }
      needsRetry=false;retry.hidden=true;
      const result=correct==='equal'?'색칠한 길이가 같아요.':`분수 ${correct}의 색칠한 길이가 더 길어요.`;
      const explanation=index===0?' 같은 크기로 나눈 조각이므로 색칠한 조각 수를 비교할 수 있어요.':index===1&&correct!=='equal'?' 전체를 더 잘게 나누면 한 조각은 더 작아져요.':'';
      feedback.textContent=`정답이에요! ${result}${explanation}`;choices.querySelectorAll('button').forEach(c=>c.disabled=true);
    }));
    const footer=make('div','reading-footer');if(index>0)footer.append(button('← 이전 활동',()=>activate(index-1)));if(index<3)footer.append(button('다음 활동 →',()=>activate(index+1)));page.append(footer);
    host.append(page);return page;
  }
  function activate(index){pages.forEach((page,i)=>page.hidden=i!==index);navigation.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',String(i===index)));}
  lessons.forEach((lesson,i)=>{navigation.append(button(`4-${i+1}`,()=>activate(i)));pages.push(createLesson(lesson,i));});activate(0);
})();
