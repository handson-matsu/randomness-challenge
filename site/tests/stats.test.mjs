import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {analyze, comparison, randomSequence, percent} from '../dist/stats.mjs';
test('extreme sequences and overlapping ABA/BAB',()=>{
 assert.deepEqual(analyze(Array(100).fill('A')),{balance:100,switches:0,longest:100,triples:0,runs:[0,0,0,0,1]});
 assert.deepEqual(analyze(Array.from({length:100},(_,i)=>i%2?'B':'A')),{balance:50,switches:99,longest:1,triples:98,runs:[100,0,0,0,0]});
 assert.deepEqual(analyze('ABBABBBAA'.split('')).runs,[2,2,1,0,0]);
 assert.equal(analyze('ABABA'.split('')).triples,3);
});
test('all 1024 ten-letter sequences agree with independent definitions',()=>{
 for(let n=0;n<1024;n++){
 const str=n.toString(2).padStart(10,'0').replaceAll('0','A').replaceAll('1','B');
 const result=analyze([...str]);
 const runs=str.match(/A+|B+/g);
 assert.equal(result.longest,Math.max(...runs.map(x=>x.length)));
 assert.equal(result.switches,runs.length-1);
 assert.equal(result.triples,[...str.matchAll(/(?=(ABA|BAB))/g)].length);
 }
});
test('inclusive tails select the correct side',()=>{
 assert.equal(comparison([1,2,4,2,1],1).count,3);
 assert.equal(comparison([1,2,4,2,1],3).count,3);
 assert.equal(comparison([1,2,4,2,1],2).count,7);
 assert.equal(comparison([1,2,4,2,1],3).lower,false);
 assert.match(percent(0,1e6),/0%とは限りません/);
 assert.match(percent(1,1e6),/0.0001%/);
});
test('reference distributions are complete and agree with theoretical means',()=>{
 const d=JSON.parse(readFileSync(new URL('../dist/distribution.json',import.meta.url)));
 for(const h of Object.values(d.histograms))assert.equal(h.reduce((a,b)=>a+b,0),1e6);
 for(const [key,expected] of [['balance',50],['switches',49.5],['triples',24.5]])assert.ok(Math.abs(comparison(d.histograms[key],0).mean-expected)<.08);
 assert.ok(Math.abs(d.histograms.balance[50]/1e6-.079589)<.001);
});
test('computer generates exactly 100 valid choices',()=>{
 const seq=randomSequence();assert.equal(seq.length,100);assert.ok(seq.every(x=>x==='A'||x==='B'));
});
