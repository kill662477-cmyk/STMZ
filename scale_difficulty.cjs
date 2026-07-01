const fs = require('fs');
let code = fs.readFileSync('src/content/battleContent.ts', 'utf8');

const enemiesStart = code.indexOf('enemies: Record<string, EnemyDef>');
if (enemiesStart !== -1) {
  const before = code.substring(0, enemiesStart);
  let enemiesPart = code.substring(enemiesStart);
  
  enemiesPart = enemiesPart.replace(/maxHp:\s*(\d+)/g, (match, p1) => {
    return `maxHp: ${Math.ceil(parseInt(p1) * 1.5)}`;
  });
  
  enemiesPart = enemiesPart.replace(/kind:\s*"damage"([^}]*)amount:\s*(\d+)/g, (match, p1, p2) => {
    return `kind: "damage"${p1}amount: ${parseInt(p2) * 2}`;
  });
  
  enemiesPart = enemiesPart.replace(/피해\s+(\d+)/g, (match, p1) => {
    return `피해 ${parseInt(p1) * 2}`;
  });
  
  fs.writeFileSync('src/content/battleContent.ts', before + enemiesPart);
  console.log('Scaled enemies HP by 1.5 and damage by 2');
}
