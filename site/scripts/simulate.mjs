import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
const samples = 1_000_000;
const histograms = Object.fromEntries(['balance','switches','longest','triples'].map(k => [k, Array(101).fill(0)]));
for (let batch = 0; batch < samples/1000; batch++) {
  const bytes = randomBytes(100_000);
  for (let s = 0; s < 1000; s++) {
    let a = 0, changes = 0, triples = 0, longest = 1, run = 1, prev = -1, prev2 = -1;
    for (let i = 0; i < 100; i++) {
      const bit = bytes[s*100+i]&1;
      a += bit;
      if (i) { if (bit !== prev) { changes++; run = 1; } else run++; }
      if (i >= 2 && bit === prev2 && bit !== prev) triples++;
      longest = Math.max(longest, run); prev2 = prev; prev = bit;
    }
    histograms.balance[a]++; histograms.switches[changes]++; histograms.longest[longest]++; histograms.triples[triples]++;
  }
}
writeFileSync(new URL('../dist/distribution.json', import.meta.url), JSON.stringify({samples, length:100, probability:.5, generator:'node:crypto.randomBytes; each byte low bit', generatedAt:new Date().toISOString(), histograms}));
console.log('Generated', samples, 'independent sequences');
