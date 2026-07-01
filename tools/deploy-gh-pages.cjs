const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const distDir = path.join(__dirname, '../dist');
const gitDir = path.join(distDir, '.git');

try {
  console.log('Preparing deployment...');
  // Clean old git folder in dist if exists
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }

  const runGit = (args) => {
    execSync(`git ${args}`, { cwd: distDir, stdio: 'inherit' });
  };

  runGit('init');
  
  // Set git user config locally inside the temporary repo so push succeeds
  runGit('config user.email "kill662477@gmail.com"');
  runGit('config user.name "kill662477-cmyk"');

  runGit('checkout -b gh-pages');
  runGit('remote add origin https://github.com/kill662477-cmyk/STMZ.git');
  
  console.log('Staging files...');
  runGit('add -A');
  
  console.log('Committing build...');
  runGit('commit -m "deploy: GitHub Pages build"');
  
  console.log('Pushing to GitHub Pages (gh-pages branch)...');
  runGit('push -f origin gh-pages');

  console.log('Cleaning up temporary git assets...');
  if (fs.existsSync(gitDir)) {
    fs.rmSync(gitDir, { recursive: true, force: true });
  }
  console.log('Successfully deployed to GitHub Pages!');
} catch (e) {
  console.error('Deployment failed:', e);
  process.exit(1);
}
