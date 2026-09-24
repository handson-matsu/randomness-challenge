export function analyze(sequence) {
  if (!sequence.length || sequence.some(x => x !== 'A' && x !== 'B')) throw new Error('A/Bの列が必要です');
  let switches = 0, triples = 0, run = 1;
  const runs = [];
  for (let i = 1; i < sequence.length; i++) {
    if (sequence[i] !== sequence[i - 1]) { switches++; runs.push(run); run = 1; } else run++;
    if (i >= 2 && sequence[i] === sequence[i - 2] && sequence[i] !== sequence[i - 1]) triples++;
  }
  runs.push(run);
  return { balance: sequence.filter(x => x === 'A').length, switches, longest: Math.max(...runs), triples, runs: [1,2,3,4,5].map(n => runs.filter(r => n === 5 ? r >= 5 : r === n).length) };
}
export function randomSequence(length = 100) {
  if (!globalThis.crypto?.getRandomValues) throw new Error('この環境では安全な乱数を使えません。HTTPSまたはlocalhostで開いてください。');
  return Array.from(crypto.getRandomValues(new Uint8Array(length)), n => n & 1 ? 'A' : 'B');
}
export function comparison(histogram, value) {
  const total = histogram.reduce((a,b) => a+b, 0);
  const mean = histogram.reduce((a,b,i) => a+b*i, 0) / total;
  const lower = value <= mean;
  const count = histogram.reduce((sum,n,i) => sum + ((lower ? i <= value : i >= value) ? n : 0), 0);
  const equal = histogram[value] || 0;
  return { mean, lower, count, total, percent: 100*count/total, equalPercent: 100*equal/total };
}
export function percent(count, total) {
  if (!count) return `100万組中0組（0%とは限りません）`;
  const p = count / total * 100;
  return `約${p < .01 ? p.toFixed(4) : p < 1 ? p.toFixed(3) : p.toFixed(1)}%`;
}
