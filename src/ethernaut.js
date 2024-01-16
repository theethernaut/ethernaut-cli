const { Command } = require('commander');
const {
  makeInteractive,
} = require('./internal/interactive-commands/make-interactive');
const { addCommands } = require('./internal/add-commands');
const { parseArgv } = require('./internal/parse-argv');

const program = new Command();

program
  .name('ethernaut')
  .description('Ethereum swiss army knife/game/tool/superweapon')
  .version('1.0.0'); // TODO: Read from package.json

addCommands('commands', program);
makeInteractive(program);

parseArgv(program);