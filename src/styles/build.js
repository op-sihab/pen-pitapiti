const fs = require('fs');
const path = require('path');

const stylesDir = __dirname;
const targetCss = path.join(__dirname, '..', 'assets', 'index-D8kaGhxM.css');

const modules = [
  'tokens.css',
  'themes.css',
  'base.css',
  'components.css',
  'modals.css',
  'picker.css',
  'game.css',
  'setup.css',
  'lobby.css',
  'animations.css',
  'responsive.css'
];

let bundle = '/* PEN FIGHT COMPILED STYLESHEET */\n\n';
for (const mod of modules) {
  const p = path.join(stylesDir, mod);
  if (fs.existsSync(p)) {
    bundle += fs.readFileSync(p, 'utf8') + '\n\n';
  }
}

fs.writeFileSync(targetCss, bundle, 'utf8');
console.log('Successfully compiled styles/*.css -> assets/index-D8kaGhxM.css (' + bundle.length + ' bytes)!');
