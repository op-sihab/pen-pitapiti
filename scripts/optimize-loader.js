const fs = require('fs');

const files = [
  'public/games/pen-fight/js/game.js',
  'public/games/pen-fight/assets/index-BzLvPmRC.js'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Instant completion in bO when t >= 1
  const oldBoStep = 'else{let e=Math.min(1,Math.max(this.value,t)),r=this.value+(e-this.value)*(1-Math.exp(-n*7));this.value=Math.min(e,Math.max(r,this.value+n*.35))}return this.value';
  const newBoStep = 'else{if(t>=1){this.value=1;return 1}let e=Math.min(1,Math.max(this.value,t)),r=this.value+(e-this.value)*(1-Math.exp(-n*24));this.value=Math.min(e,Math.max(r,this.value+n*1.5))}return this.value';

  if (content.includes(oldBoStep)) {
    content = content.replace(oldBoStep, newBoStep);
    console.log(filePath, 'bO.step optimized');
  } else {
    console.log(filePath, 'bO.step target not found');
  }

  // 2. Immediate completion in SO.show
  const oldSoFinish = 'l!==null&&l>=1&&u>=1?t():this.frame=requestAnimationFrame(a)';
  const newSoFinish = '(l!==null&&l>=1)||(u>=1)?(this.set(1),t()):this.frame=requestAnimationFrame(a)';

  if (content.includes(oldSoFinish)) {
    content = content.replace(oldSoFinish, newSoFinish);
    console.log(filePath, 'SO.show optimized');
  } else {
    console.log(filePath, 'SO.show target not found');
  }

  // 3. Font ready race (max 200ms wait instead of blocking indefinitely)
  const oldFontReady = '(document.fonts?.ready??Promise.resolve()).then(ek,ek)';
  const newFontReady = 'Promise.race([document.fonts?.ready??Promise.resolve(),new Promise(e=>setTimeout(e,200))]).then(ek,ek)';

  if (content.includes(oldFontReady)) {
    content = content.replace(oldFontReady, newFontReady);
    console.log(filePath, 'fonts.ready race optimized');
  } else {
    console.log(filePath, 'fonts.ready target not found');
  }

  // 4. Update Gx with Atma font
  const b = String.fromCharCode(96);
  const oldGx = 'Gx={title:' + b + 'Fredoka, \'Hind Siliguri\', \'Plus Jakarta Sans\', system-ui, sans-serif' + b + ',body:' + b + '\'Plus Jakarta Sans\', \'Hind Siliguri\', Nunito, system-ui, sans-serif' + b + ',system:' + b + '\'Hind Siliguri\', \'Plus Jakarta Sans\', system-ui, sans-serif' + b + '}';
  const newGx = 'Gx={title:' + b + '\'Atma\', Fredoka, \'Hind Siliguri\', \'Plus Jakarta Sans\', system-ui, sans-serif' + b + ',body:' + b + '\'Atma\', \'Plus Jakarta Sans\', \'Hind Siliguri\', Nunito, system-ui, sans-serif' + b + ',system:' + b + '\'Atma\', \'Hind Siliguri\', \'Plus Jakarta Sans\', system-ui, sans-serif' + b + '}';

  if (content.includes(oldGx)) {
    content = content.replace(oldGx, newGx);
    console.log(filePath, 'Gx updated with Atma');
  } else {
    console.log(filePath, 'Gx target not found');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(filePath, 'saved successfully!');
});
