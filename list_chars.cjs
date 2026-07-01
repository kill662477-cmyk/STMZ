const fs = require('fs');
const content = fs.readFileSync('src/content/battleContent.ts', 'utf8');
const regex = /id:\s*"([^"]+)",\s*name:\s*"([^"]+)"/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(match[1] + ': ' + match[2]);
}
