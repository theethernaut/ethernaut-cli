const { types } = require('hardhat/config');
const helper = require('../internal/helper');

require('../scopes/oz')
  .task(
    'instance',
    'Creates an instance of a level, so that it can be played. The address of the instance is printed to the console. Use this address to interact with the contract using the ethernaut-cli call command. Make sure to use the info command to get instructions on how to complete the level.'
  )
  // TODO: Remove optionality once I can extend environment before parsing tasks
  .addOptionalPositionalParam(
    'level',
    'The level number',
    undefined,
    types.string
  )
  .setAction(async ({ level }, hre) => {
    const deploymentInfo = helper.getDeploymentInfo();

    // Prepare the main game contract
    const gameAddress = deploymentInfo.ethernaut;
    const abi = helper.getEthernautAbi();
    const ethernaut = await hre.ethers.getContractAt(abi, gameAddress);

    // Create the level instance
    const idx = parseInt(level) - 1;
    const levelAddress = deploymentInfo[idx];
    const tx = await ethernaut.createLevelInstance(levelAddress);
    const receipt = await tx.wait();
    // console.log(receipt);
    const events = receipt.logs.map((log) => ethernaut.interface.parseLog(log));
    const createdEvent = events[0];
    // console.log(events);
    const instanceAddress = createdEvent.args[1];
    console.log(`Instance created ${instanceAddress}`);
  });