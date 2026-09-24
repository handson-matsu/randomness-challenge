import { analyze, randomSequence, comparison, percent } from './stats.mjs';
const $ = id => document.getElementById(id);
let human = [], computer = null, attempt = 0, reference = null;
const definitions = [
  {key:'balance',title:'A/Bのバランス',description:'AとBを、それぞれ何回選んだ？',label:'Aの回数',unit:'回'},
  {key:'switches',title:'切り替え回数',description:'A→B、B→Aに変わった回数。',label:'切り替え回数',unit:'回'},
  {key:'longest',title:'最長連続回数',description:'同じ文字が、いちばん長く続いたところ。',label:'最長連続',unit:'回'},
  {key:'triples',title:'ABA・BABの回数',description:'3文字の「行ったり来たり」。重なりも数えます。',label:'ABA・BAB',unit:'回'}
];
function tiles(sequence, placeholders = false) {
  return Array.from({length: placeholders ? 100 : sequence.length}, (_,i) => `<span class="tile ${sequence[i]?.toLowerCase() || ''}" ${sequence[i] ? '' : 'aria-hidden="true"'}>${sequence[i] || '·'}</span>`).join('');
}
function renderInput() {
  $('count').textContent = human.length;
  $('remaining').textContent = `あと${100-human.length}回`;
  $('progress-fill').style.width = `${human.length}%`;
  document.querySelector('.progress').setAttribute('aria-valuenow',human.length);
  $('sequence').innerHTML = tiles(human,true);
  if (human.length) $('sequence').children[human.length-1].classList.add('fresh');
}
function choose(letter) {
  if (human.length >= 100) return;
  human.push(letter); renderInput();
  const button = $(`choose-${letter.toLowerCase()}`);
  button.classList.remove('pressed'); void button.offsetWidth; button.classList.add('pressed');
  setTimeout(() => button.classList.remove('pressed'),85);
  if (human.length === 100) {
    $('play').hidden = true; $('results').hidden = false;
    renderResults(); $('result-title').focus(); window.scrollTo({top:0,behavior:'instant'});
  }
}
function reset() {
  human = []; computer = null; attempt = 0;
  if(reference) $('status').textContent = '';
  $('play').hidden = false; $('results').hidden = true;
  renderInput(); $('choose-a').focus(); window.scrollTo({top:0,behavior:'instant'});
}
function probabilityText(def,value) {
  const c = comparison(reference.histograms[def.key],value);
  return `<p class="probability">ランダムな100回で、<br>${def.label}が${value}回${c.lower ? '以下' : '以上'}になる割合<strong>${percent(c.count,c.total)}</strong></p>`;
}
function valueColumn(def, result, isComputer=false) {
  const label = isComputer ? 'コンピュータ' : 'あなた';
  if (!result) return `<div class="value-column computer"><span class="value-label">${label}</span><p class="waiting">上のボタンで<br>比べてみよう</p></div>`;
  const value = result[def.key];
  return `<div class="value-column ${isComputer ? 'computer' : ''}"><span class="value-label">${label}</span>${def.key === 'balance' ? `<div class="big-value balance-value"><span>A <b>${value}</b><small>回</small></span><span>B <b>${100-value}</b><small>回</small></span></div>` : `<div class="big-value">${value}<small>回</small></div>`}${reference ? probabilityText(def,value) : '<p class="waiting">比較データを読み込み中…</p>'}</div>`;
}
function chart(def,h,c) {
  const hist = reference.histograms[def.key];
  const populated = hist.map((n,i) => n ? i : -1).filter(i=>i>=0);
  const min = Math.max(0,Math.min(populated[0],h,c ?? h)-1);
  const max = Math.min(100,Math.max(populated.at(-1),h,c ?? h)+1);
  const width = 360, step = width/(max-min+1), peak = Math.max(...hist);
  let bars = '';
  for(let i=min;i<=max;i++) {const height = hist[i]/peak*66;bars += `<rect x="${(i-min)*step}" y="${94-height}" width="${Math.max(.6,step-1)}" height="${height}" rx="1" fill="#dce1ed"/>`;}
  function marker(value,color,label,y) {const x=(value-min+.5)*step;return `<line x1="${x}" y1="${y+5}" x2="${x}" y2="96" stroke="${color}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="4" fill="${color}"/><text x="${Math.max(22,Math.min(338,x))}" y="${y-8}" text-anchor="middle" font-size="11" font-weight="bold" fill="${color}">${label} ${value}</text>`;}
  const mean = comparison(hist,h).mean;
  return `<figure class="chart"><svg viewBox="0 0 360 112" role="img" aria-label="${def.title}の分布。あなた${h}回${c === null ? '' : `、コンピュータ${c}回`}、基準平均${mean.toFixed(1)}回。">${bars}${marker(h,'#284de8','あなた',24)}${c===null?'':marker(c,'#b35a20','PC',52)}</svg><div class="axis"><span>${min}回</span><span>基準の平均 ${mean.toFixed(1)}回</span><span>${max}回</span></div><figcaption class="chart-caption">山が高いところほど、多く出た値。</figcaption></figure>`;
}
function renderResults() {
  const h = analyze(human), c = computer ? analyze(computer) : null;
  $('computer-count').textContent = attempt ? `（${attempt}回目）` : '';
  $('analysis').innerHTML = definitions.map((def,i) => `<article class="metric"><div class="metric-title"><span>0${i+1}</span><h2>${def.title}</h2></div><p class="metric-description">${def.description}</p><div class="values">${valueColumn(def,h)}${valueColumn(def,c,true)}</div>${reference ? chart(def,h[def.key],c ? c[def.key] : null) : ''}${def.key==='balance' && reference ? `<p class="balance-note">50:50ちょうどになる割合は ${percent(reference.histograms.balance[50],reference.samples)}。揃っているほど高得点、ではありません。</p>` : ''}</article>`).join('');
  $('run-table').innerHTML = `<table><thead><tr><th scope="col">連の長さ</th>${['1連','2連','3連','4連','5連以上'].map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody><tr><th scope="row">あなた</th>${h.runs.map(x=>`<td>${x}個</td>`).join('')}</tr><tr><th scope="row">コンピュータ</th>${h.runs.map((_,i)=>`<td>${c ? c.runs[i]+'個' : '—'}</td>`).join('')}</tr></tbody></table>`;
  $('result-sequences').innerHTML = `<div class="sequence-block"><h3>あなたの100回</h3><div class="sequence">${tiles(human)}</div></div>${computer ? `<div class="sequence-block"><h3>コンピュータの100回（${attempt}回目）</h3><div class="sequence">${tiles(computer)}</div></div>` : ''}`;
}
function generateComputer() {
  if(human.length!==100) throw new Error('まず100回選んでください');
  computer = randomSequence(); attempt++; renderResults();
  $('status').textContent = `コンピュータの${attempt}回目の結果を表示しました。`;
  return analyze(computer);
}
$('choose-a').addEventListener('click',()=>choose('A'));
$('choose-b').addEventListener('click',()=>choose('B'));
document.querySelectorAll('.reset').forEach(b=>b.addEventListener('click',reset));
$('computer').addEventListener('click',()=>{try {generateComputer();}catch(e){$('status').textContent=e.message;}});
document.addEventListener('keydown',e=>{if(e.repeat || e.ctrlKey || e.metaKey || e.altKey || human.length>=100)return;const letter=e.key.toUpperCase();if(letter==='A'||letter==='B'){e.preventDefault();choose(letter);}});
async function loadReference() {
  try {
    const response = await fetch('./distribution.json');
    if (!response.ok) throw new Error('load');
    reference = await response.json();
    if (!reference.histograms || reference.samples !== 1000000) throw new Error('invalid');
    if (human.length===100) renderResults();
  } catch {
    $('status').replaceChildren(document.createTextNode('比較データを読み込めませんでした。接続を確認してください。 '));
    const retry = document.createElement('button');retry.textContent='再読み込み';retry.className='text-button';retry.onclick=()=>{$('status').textContent='';loadReference();};$('status').append(retry);
  }
}
renderInput();loadReference();
if(document.modelContext?.registerTool) {
  try { Promise.resolve(document.modelContext.registerTool({name:'read_experiment',description:'現在の入力回数と完了済みの実験結果を読む。',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:(input)=>{if(!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).length) throw new Error('引数は空のオブジェクトにしてください');return {count:human.length,human:human.length===100?analyze(human):null,computer:computer?analyze(computer):null,attempt};}})).catch(()=>{}); } catch {}
}
