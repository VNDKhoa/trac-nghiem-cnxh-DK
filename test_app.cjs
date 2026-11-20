const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

class Element {
  constructor(tag = 'div') {
    this.tagName = tag; this.children = []; this.listeners = {}; this.style = {};
    this.classes = new Set(); this.classList = {
      add: (...x) => x.forEach(v=>this.classes.add(v)),
      toggle: (x, force) => { if (force === undefined ? !this.classes.has(x) : force) this.classes.add(x); else this.classes.delete(x); },
      contains: x => this.classes.has(x)
    };
    this.value = ''; this.checked = false; this.disabled = false; this.textContent = '';
  }
  set className(value) { this.classes = new Set(value.split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classes].join(' '); }
  set innerHTML(value) { this._innerHTML = value; }
  get innerHTML() { return this._innerHTML || ''; }
  replaceChildren(...children) { this.children = children; }
  append(...children) { this.children.push(...children); }
  setAttribute(key, value) { this[key] = value; }
  addEventListener(type, fn) { (this.listeners[type] ||= []).push(fn); }
  click() { for (const fn of this.listeners.click || []) fn({target:this}); }
  change() { for (const fn of this.listeners.change || []) fn({target:this}); }
}
const ids = ['setSelect','shuffleAll','studyMode','stats','progressFill','questionGrid','retryWrong','exitRetry','restart','position','questionId','statusTag','topic','questionText','options','submitMulti','feedback','sourceImage','sourcePath','previous','next'];
const bank = [
  {id:'T-001',chapter:'Test',topic:'A',question:'Một đáp án',sourceImage:'1.png',options:[{id:'a',text:'A'},{id:'b',text:'B'}],answerIds:['a'],explanation:'Giải thích'},
  {id:'T-002',chapter:'Test',topic:'B',question:'Nhiều đáp án',sourceImage:'2.png',options:[{id:'a',text:'A'},{id:'b',text:'B'},{id:'c',text:'C'}],answerIds:['b','c'],selectionType:'multiple'},
  {id:'T-003',chapter:'Test',topic:'B',question:'Chưa xác minh',sourceImage:'3.png',options:[{id:'a',text:'A'},{id:'b',text:'B'}],answerIds:null,suggestedAnswerIds:['a']}
];
const storage = new Map();
function boot() {
  const elements = Object.fromEntries(ids.map(id=>[id,new Element()]));
  const document = {getElementById:id=>elements[id],createElement:tag=>new Element(tag)};
  const context = {window:{QUESTION_BANK:bank},document,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},setTimeout:fn=>{context.pending=fn;return 1;},clearTimeout:()=>{context.pending=null;},confirm:()=>true,Math};
  vm.runInNewContext(fs.readFileSync('app.js','utf8'),context);
  return {ui:elements,context};
}
let {ui,context} = boot();
assert(ui.feedback.classList.contains('hidden'), 'chưa làm không lộ đáp án');
ui.options.children[1].click();
assert.match(ui.feedback.children[0].textContent,/Đáp án đúng: A/);
assert(ui.questionText.classList.contains('question-wrong'),'câu sai chuyển đỏ');
assert(ui.options.children[1].classList.contains('incorrect'),'lựa chọn sai chuyển đỏ');
assert(ui.options.children[0].classList.contains('correct-choice'),'đáp án đúng nổi nền xanh khi chọn sai');
assert.match(ui.stats.innerHTML,/1<\/strong> sai/);
ui.next.click();
assert.match(ui.questionText.textContent,/Nhiều đáp án/);
ui.options.children[1].click(); ui.options.children[2].click(); ui.submitMulti.click();
assert.match(ui.feedback.children[0].textContent,/Chính xác/);
assert(ui.feedback.classList.contains('good'),'kết quả đúng có nền xanh');
assert(ui.options.children[1].classList.contains('correct-choice'),'lựa chọn đúng nổi bật màu xanh');
context.pending();
assert.match(ui.questionText.textContent,/Chưa xác minh/);
ui.options.children[0].click();
assert.match(ui.feedback.children[0].textContent,/không được chấm điểm/);
assert.match(ui.stats.innerHTML,/1<\/strong> đúng · <strong>1<\/strong> sai/);
({ui,context}=boot());
assert.match(ui.questionText.textContent,/Chưa xác minh/);
assert.match(ui.stats.innerHTML,/3\/3/);
ui.retryWrong.click();
assert.match(ui.questionText.textContent,/Một đáp án/);
assert.equal(ui.questionGrid.children.length,1);
ui.options.children[0].click();
assert.match(ui.feedback.children[0].textContent,/Chính xác/);
ui.retryWrong.click();
assert.equal(ui.questionGrid.children.length,1,'lặp lại vòng câu sai');
ui.exitRetry.click();
const beforeShuffle = JSON.parse(storage.get('cnxh-quiz-v1:all'));
ui.shuffleAll.click();
const afterShuffle = JSON.parse(storage.get('cnxh-quiz-v1:all'));
assert.equal(ui.options.children.length,2);
assert.notDeepEqual(afterShuffle.order,beforeShuffle.order,'bấm nút trộn thứ tự câu');
assert.notDeepEqual(afterShuffle.optionOrders['T-001'],beforeShuffle.optionOrders['T-001'],'bấm nút trộn đáp án');
assert.deepEqual(ui.questionGrid.children.map(button=>button.textContent),['1','2','3'],'số câu vẫn theo thứ tự 1, 2, 3');
assert.equal(ui.questionId.textContent,`Câu ${afterShuffle.index+1}`,'tiêu đề theo vị trí mới');
ui.restart.click();
assert.match(ui.stats.innerHTML,/0\/3/);
ui.shuffleAll.click();
assert.equal(ui.questionGrid.children.length,3);
const savedOrder = JSON.parse(storage.get('cnxh-quiz-v1:all')).order;
({ui,context}=boot());
assert.deepEqual(JSON.parse(storage.get('cnxh-quiz-v1:all')).order,savedOrder,'thứ tự đã trộn được lưu');
assert.equal(ui.setSelect.children.length,2,'chỉ có Tổng hợp và bộ chương');
ui.setSelect.value='chapter:Test'; ui.setSelect.change();
assert.equal(ui.questionGrid.children.length,3,'bộ chương có số câu động');
ui.questionGrid.children[1].click();
ui.options.children[1].click(); ui.submitMulti.click();
assert.match(ui.feedback.children[0].textContent,/Chưa đúng/,'chọn thiếu một đáp án phải sai');
ui.setSelect.value='all'; ui.setSelect.change();
assert.equal(ui.questionGrid.children.length,3,'tiến độ riêng theo bộ');
assert.match(ui.stats.innerHTML,/0\/3/,'tiến độ bộ tổng hợp không bị ảnh hưởng');
storage.set('cnxh-quiz-v1:all', JSON.stringify({order:['T-001','T-002','T-003'],index:1,shuffleQuestions:true,shuffleOptions:false,attempts:{'T-001':{status:'wrong',selectedIds:['b']}},wrongHistory:['T-001']}));
({ui,context}=boot());
assert.match(ui.stats.innerHTML,/1<\/strong> sai/,'kết quả cũ được giữ');
assert.equal(JSON.parse(storage.get('cnxh-quiz-v1:all')).shuffleOptions,undefined);
storage.clear();
({ui,context}=boot());
ui.shuffleAll.click();
assert.deepEqual(ui.options.children.map(button=>button.children[0].textContent),['A','B'],'nhãn A, B giữ nguyên vị trí');
assert.deepEqual(ui.options.children.map(button=>button.children[1].textContent),['B','A'],'chỉ nội dung đáp án bị đảo');
ui.options.children[0].click();
assert.match(ui.feedback.children[0].textContent,/Đáp án đúng: B/,'kết quả dùng nhãn hiển thị hiện tại');
console.log('PASS: chưa lộ đáp án, đúng/sai, nhiều đáp án, câu không chấm, tải lại, trộn câu/đáp án, bộ riêng, vòng câu sai, làm lại từ đầu');
