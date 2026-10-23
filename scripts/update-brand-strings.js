const fs = require('fs');

const files = [
  'public/games/pen-fight/js/game.js',
  'public/games/pen-fight/assets/index-BzLvPmRC.js'
];

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace Bangla brand name
  content = content.replace('"brand.name":"পেন ফাইট"', '"brand.name":"পেন পিটাপিটি"');
  content = content.replace('"brand.name":`Pen Fight`', '"brand.name":`Pen Pitapiti`');
  content = content.replace('"app.title":`Pen Fight`', '"app.title":`Pen Pitapiti`');
  content = content.replace('"app.title":"পেন ফাইট"', '"app.title":"পেন পিটাপিটি"');
  content = content.replace('"game.label":`Pen Fight`', '"game.label":`Pen Pitapiti`');
  content = content.replace('"game.label":"পেন ফাইট"', '"game.label":"পেন পিটাপিটি"');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(filePath, 'brand strings updated successfully');
});
