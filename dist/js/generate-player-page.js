const fs = require('fs');
const path = require('path');

function generatePlayerPage(playerName) {
  // Read the template
  const templatePath = path.join(__dirname, '../templates/player-template.html');
  let template = fs.readFileSync(templatePath, 'utf8');
  
  // Replace all instances of {{PLAYER_NAME}} with the actual player name
  template = template.replace(/{{PLAYER_NAME}}/g, playerName);
  
  // Write the new player file
  const outputPath = path.join(__dirname, `../${playerName.toLowerCase()}.html`);
  fs.writeFileSync(outputPath, template);
  
  console.log(`Generated page for ${playerName} at ${outputPath}`);
}

// Generate pages for all players
const players = ['Finley', 'Bent', 'Ricky'];
players.forEach(generatePlayerPage); 