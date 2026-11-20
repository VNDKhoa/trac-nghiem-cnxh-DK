(() => {
  'use strict';
  const bank = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK.filter(q => q && q.id && q.question && Array.isArray(q.options)) : [];
  const byId = new Map(bank.map(q => [q.id, q]));
  const $ = id => document.getElementById(id);
  const ids = ['setSelect','shuffleAll','studyMode','stats','progressFill','questionGrid','retryWrong','exitRetry','restart','position','questionId','statusTag','topic','questionText','options','submitMulti','feedback','sourceImage','sourcePath','previous','next'];
  const ui = Object.fromEntries(ids.map(id => [id, $(id)]));
  const sets = [{id:'all',name:'Tổng hợp',questions:bank}];
  const chapters = [...new Set(bank.map(q => q.chapter || 'Chương 6'))];
  for (const chapter of chapters) sets.push({id:`chapter:${chapter}`,name:chapter,questions:bank.filter(q => (q.chapter || 'Chương 6') === chapter)});
  let set = sets[0], state, timer = null, draft = new Set();

  const randomOrder = values => {
    const out = [...values];
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i],out[j]] = [out[j],out[i]]; }
    return out;
  };
  const shuffledAgain = values => {
    const out = randomOrder(values);
    if (out.length > 1 && out.every((value, index) => value === values[index])) [out[0], out[1]] = [out[1], out[0]];
    return out;
  };
  const key = () => `cnxh-quiz-v1:${set.id}`;
  const save = () => { try { localStorage.setItem(key(), JSON.stringify(state)); } catch (_) {} };
  const newState = () => ({order:set.questions.map(q=>q.id),optionOrders:{},attempts:{},wrongHistory:[],index:0,retry:false,retryOrder:[],retryIndex:0,study:false});
  const load = () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(key()) || '{}') || {}; } catch (_) { saved = {}; }
    state = {...newState(), ...saved};
    const valid = new Set(set.questions.map(q=>q.id));
    state.order = [...new Set((Array.isArray(state.order) ? state.order : []).filter(id=>valid.has(id)))];
    for (const id of valid) if (!state.order.includes(id)) state.order.push(id);
    state.retryOrder = (Array.isArray(state.retryOrder) ? state.retryOrder : []).filter(id=>valid.has(id));
    state.wrongHistory = [...new Set((Array.isArray(state.wrongHistory) ? state.wrongHistory : []).filter(id=>valid.has(id)))];
    state.attempts = state.attempts && typeof state.attempts === 'object' ? state.attempts : {};
    for (const [id, attempt] of Object.entries(state.attempts)) {
      if (attempt?.status === 'ungraded' && byId.has(id) && hasAnswer(byId.get(id))) delete state.attempts[id];
    }
    state.optionOrders = state.optionOrders && typeof state.optionOrders === 'object' ? state.optionOrders : {};
    state.index = Math.min(Math.max(0, Number(state.index)||0), Math.max(0,state.order.length-1));
    state.retryIndex = Math.min(Math.max(0, Number(state.retryIndex)||0), Math.max(0,state.retryOrder.length-1));
    delete state.shuffle;
    delete state.shuffleQuestions;
    delete state.shuffleOptions;
    if (!state.retryOrder.length) state.retry = false;
    save();
  };
  const sequence = () => state.retry ? state.retryOrder : state.order;
  const position = () => state.retry ? state.retryIndex : state.index;
  const current = () => byId.get(sequence()[position()]);
  const hasAnswer = q => Array.isArray(q.answerIds) && q.answerIds.length > 0 && q.answerIds.every(id=>q.options.some(o=>o.id===id));
  const sameSet = (a,b) => a.length === b.length && a.every(id=>b.includes(id));
  const optionOrder = q => {
    const actual = q.options.map(o=>o.id);
    let order = state.optionOrders[q.id];
    if (!Array.isArray(order) || !sameSet(order,actual)) {
      order = actual;
      state.optionOrders[q.id] = order;
      save();
    }
    return order.map(id=>q.options.find(o=>o.id===id));
  };
  const visibleAnswerLabels = q => optionOrder(q)
    .flatMap((option, index) => q.answerIds.includes(option.id) ? [String.fromCharCode(65 + index)] : []);
  const move = index => {
    if (timer) { clearTimeout(timer); timer = null; }
    if (state.retry) state.retryIndex = index; else state.index = index;
    save(); render();
  };
  const feedback = (q, attempt) => {
    ui.feedback.replaceChildren();
    ui.feedback.className = 'feedback';
    const line = document.createElement('p');
    if (state.study) {
      line.textContent = hasAnswer(q) ? 'Đáp án đã xác minh: ' + visibleAnswerLabels(q).join(', ') : 'Chưa có đáp án xác minh';
    } else if (attempt?.status === 'correct') {
      line.textContent = 'Chính xác!'; ui.feedback.classList.add('good');
    } else if (attempt?.status === 'wrong') {
      line.textContent = 'Chưa đúng. Đáp án đúng: ' + visibleAnswerLabels(q).join(', '); ui.feedback.classList.add('bad');
    } else if (attempt?.status === 'ungraded') {
      line.textContent = 'Chưa có đáp án xác minh. Câu này không được chấm điểm.';
    } else { ui.feedback.classList.add('hidden'); return; }
    ui.feedback.append(line);
    if ((state.study || attempt?.status === 'wrong') && hasAnswer(q) && q.explanation) {
      const detail = document.createElement('p'); detail.textContent = q.explanation; ui.feedback.append(detail);
    }
    if (!hasAnswer(q) && q.reviewNote) { const note = document.createElement('p'); note.className='muted'; note.textContent='[CẦN KIỂM TRA] '+q.reviewNote; ui.feedback.append(note); }
  };
  const render = () => {
    ui.setSelect.value = set.id;
    ui.studyMode.checked = !!state.study;
    const order = sequence();
    const q = current();
    const statuses = set.questions.map(item=>state.attempts[item.id]?.status);
    const done = statuses.filter(Boolean).length, good = statuses.filter(x=>x==='correct').length, bad = statuses.filter(x=>x==='wrong').length;
    ui.stats.innerHTML = `<strong>${done}/${set.questions.length}</strong> đã làm · <strong>${good}</strong> đúng · <strong>${bad}</strong> sai`;
    ui.progressFill.style.width = set.questions.length ? `${100*done/set.questions.length}%` : '0%';
    ui.retryWrong.disabled = !state.wrongHistory.length;
    ui.retryWrong.textContent = state.retry ? 'Lặp lại vòng câu sai' : `Làm lại câu sai (${state.wrongHistory.length})`;
    ui.exitRetry.classList.toggle('hidden', !state.retry);
    ui.questionGrid.replaceChildren();
    order.forEach((id,i) => {
      const button = document.createElement('button'); button.type='button'; button.textContent=String(i+1);
      const status=state.attempts[id]?.status;
      if (status) button.classList.add(status);
      if (i===position()) { button.classList.add('current'); button.setAttribute('aria-current','step'); }
      button.title=`Câu ${i+1} · mã gốc ${id}${status ? ` · ${status}` : ''}`;
      button.addEventListener('click',()=>move(i)); ui.questionGrid.append(button);
    });
    if (!q) { ui.questionText.textContent='Chưa có câu hỏi trong bộ này.'; return; }
    const attempt = state.attempts[q.id];
    draft = new Set(attempt?.selectedIds || []);
    ui.position.textContent=`${state.retry ? 'VÒNG CÂU SAI' : set.name.toUpperCase()} · ${position()+1}/${order.length}`;
    ui.questionId.textContent=`Câu ${position()+1}`;
    ui.statusTag.textContent=state.study?'Chế độ Học':attempt?.status==='correct'?'Đã đúng':attempt?.status==='wrong'?'Đã sai':attempt?.status==='ungraded'?'Chưa chấm':hasAnswer(q)?'Chưa làm':'Chưa có đáp án xác minh';
    ui.statusTag.classList.toggle('wrong', attempt?.status==='wrong');
    ui.statusTag.classList.toggle('correct', attempt?.status==='correct');
    ui.topic.textContent=q.chapter || '';
    ui.questionText.textContent=q.question;
    ui.questionText.classList.toggle('question-wrong', attempt?.status==='wrong');
    ui.sourceImage.src=q.sourceImage;
    ui.sourcePath.textContent=q.sourceImage;
    ui.options.replaceChildren();
    const multi = q.selectionType === 'multiple' || (Array.isArray(q.answerIds) && q.answerIds.length > 1);
    for (const [index, option] of optionOrder(q).entries()) {
      const button=document.createElement('button'); button.type='button'; button.className='option';
      const letter=document.createElement('span'); letter.className='letter'; letter.textContent=String.fromCharCode(65 + index);
      const value=document.createElement('span'); value.textContent=option.text;
      button.append(letter,value);
      if (draft.has(option.id)) button.classList.add('selected');
      if (attempt?.status==='correct' && draft.has(option.id)) button.classList.add('correct-choice');
      if ((state.study || attempt?.status==='wrong') && hasAnswer(q) && q.answerIds.includes(option.id)) {
        button.classList.add('answer');
        if (attempt?.status==='wrong') button.classList.add('correct-choice');
      }
      if (attempt?.status==='wrong' && draft.has(option.id) && !q.answerIds.includes(option.id)) button.classList.add('incorrect');
      button.disabled=!!attempt && !state.study;
      button.setAttribute('aria-pressed',String(draft.has(option.id)));
      button.addEventListener('click',()=>{
        if (state.study) return;
        if (multi) { draft.has(option.id)?draft.delete(option.id):draft.add(option.id); button.classList.toggle('selected',draft.has(option.id)); button.setAttribute('aria-pressed',String(draft.has(option.id))); }
        else grade([option.id]);
      });
      ui.options.append(button);
    }
    ui.submitMulti.classList.toggle('hidden',!multi || !!attempt || state.study);
    ui.submitMulti.disabled=!draft.size;
    feedback(q,attempt);
    ui.previous.disabled=position()===0;
    ui.next.disabled=position()>=order.length-1;
    ui.next.textContent=position()>=order.length-1?'Hết bộ câu hỏi':'Câu tiếp →';
  };
  const grade = selectedIds => {
    const q=current(); if (!q || state.study || state.attempts[q.id]) return;
    const status=hasAnswer(q) ? (sameSet(selectedIds,q.answerIds)?'correct':'wrong') : 'ungraded';
    state.attempts[q.id]={status,selectedIds};
    if (status==='wrong' && !state.wrongHistory.includes(q.id)) state.wrongHistory.push(q.id);
    save(); render();
    if (status==='correct' && position()<sequence().length-1) timer=setTimeout(()=>move(position()+1),1200);
  };
  for (const item of sets) { const option=document.createElement('option'); option.value=item.id; option.textContent=`${item.name} (${item.questions.length})`; ui.setSelect.append(option); }
  ui.setSelect.addEventListener('change',()=>{set=sets.find(s=>s.id===ui.setSelect.value)||sets[0];load();render();});
  ui.shuffleAll.addEventListener('click',()=>{
    const id=current()?.id;
    state.order=shuffledAgain(state.order);
    for (const q of set.questions) {
      const ids=q.options.map(o=>o.id);
      const previous=state.optionOrders[q.id];
      state.optionOrders[q.id]=shuffledAgain(Array.isArray(previous) && sameSet(previous,ids) ? previous : ids);
    }
    state.retry=false;
    state.index=Math.max(0,state.order.indexOf(id));
    save();render();
  });
  ui.studyMode.addEventListener('change',()=>{state.study=ui.studyMode.checked;save();render();});
  ui.submitMulti.addEventListener('click',()=>grade([...draft]));
  ui.options.addEventListener('click',()=>{ui.submitMulti.disabled=!draft.size;});
  ui.previous.addEventListener('click',()=>move(position()-1));
  ui.next.addEventListener('click',()=>{if(position()<sequence().length-1)move(position()+1);});
  ui.retryWrong.addEventListener('click',()=>{if(!state.wrongHistory.length)return;state.retryOrder=state.wrongHistory.filter(id=>set.questions.some(q=>q.id===id));state.retry=true;state.retryIndex=0;for(const id of state.retryOrder)delete state.attempts[id];save();render();});
  ui.exitRetry.addEventListener('click',()=>{state.retry=false;save();render();});
  ui.restart.addEventListener('click',()=>{if(!confirm(`Xóa tiến độ riêng của bộ “${set.name}” và làm lại từ đầu?`))return;try{localStorage.removeItem(key());}catch(_){}state=newState();save();render();});
  load();render();
})();
