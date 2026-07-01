const fs = require('fs');

const nameMapping = {
  calm: '김윤환',
  hm: '배성흠',
  tyson: '박수범',
  killer: '박준오',
  ample: '사테',
  chu: '토마토',
  jji: '찌킹',
  sample: '소주양',
  sun: '햇살',
  seventytwo: '치리',
  fivehundred: '비타밍',
  zoe: '조이',
  song: '아리송이',
  bright: '먼진',
  nangni: '낭니'
};

let content = fs.readFileSync('src/content/battleContent.ts', 'utf8');

for (const [id, newName] of Object.entries(nameMapping)) {
  const regex = new RegExp(`(id:\\s*"${id}",\\s*name:\\s*")[^"]+(")`);
  content = content.replace(regex, `$1${newName}$2`);
}

fs.writeFileSync('src/content/battleContent.ts', content);
console.log('Names updated successfully.');
