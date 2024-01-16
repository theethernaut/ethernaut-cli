const { Command } = require('commander');
const ethers = require('ethers');
const logger = require('../../internal/logger');

const command = new Command();

command
  .name('to-string')
  .description('Converts bytes32 to string')
  .argument('<value>', 'Value to convert')
  .action(async (value) => {
    const result = ethers.utils.toUtf8String(value);

    logger.output(`${value} to string is <${result}>`);
  });

module.exports = command;