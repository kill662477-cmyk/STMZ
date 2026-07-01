const fs = require('fs');
let code = fs.readFileSync('src/content/battleContent.ts', 'utf8');

const enemiesStart = code.indexOf('enemies: Record<string, EnemyDef>');
if (enemiesStart !== -1) {
  const before = code.substring(0, enemiesStart);
  let enemiesPart = code.substring(enemiesStart);
  
  // Multiply current damage by 0.75 (effectively changing original 2.0x to 1.5x)
  enemiesPart = enemiesPart.replace(/kind:\s*"damage"([^}]*)amount:\s*(\d+)/g, (match, p1, p2) => {
    return `kind: "damage"${p1}amount: ${Math.round(parseInt(p2) * 0.75)}`;
  });
  
  // Update descriptions
  enemiesPart = enemiesPart.replace(/피해\s+(\d+)/g, (match, p1) => {
    return `피해 ${Math.round(parseInt(p1) * 0.75)}`;
  });
  
  fs.writeFileSync('src/content/battleContent.ts', before + enemiesPart);
  console.log('Scaled enemies damage by 0.75');
}
