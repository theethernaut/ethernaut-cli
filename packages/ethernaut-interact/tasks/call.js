const { types } = require('hardhat/config');
const { Confirm, Input } = require('enquirer');
const {
  getPopulatedFunctionSignature,
  getFunctionSignature,
  getFullEventSignature,
} = require('../internal/signatures');
const loadAbi = require('./call/load-abi');
const fnPrompt = require('./call/fn-prompt');
const paramsPrompt = require('./call/params-prompt');
const abiPathPrompt = require('./call/abi-path-prompt');
const addressPrompt = require('./call/address-prompt');
const storage = require('../internal/storage');
const output = require('common/output');
const spinner = require('common/spinner');
const debug = require('common/debugger');
const path = require('path');

const call = require('../scopes/interact')
  .task('call', 'Calls a contract function')
  .addOptionalParam(
    'abiPath',
    'The path of a json file defining the abi of the contract',
    undefined,
    types.string
  )
  .addOptionalParam(
    'address',
    'The address of the contract',
    undefined,
    types.string
  )
  .addOptionalParam(
    'fn',
    'The function of the contract to call',
    undefined,
    types.string
  )
  .addOptionalParam(
    'params',
    'The parameters to use in the function call. If the call requires multiple parameters, separate them with a comma. E.g. "0x123,42"',
    undefined,
    types.string
  )
  .setAction(async ({ abiPath, address, fn, params }, hre) => {
    try {
      await interact({ abiPath, address, fn, params });
    } catch (err) {
      debug.log(err, 'interact');
      output.problem(err.message);
    }
  });

async function interact({ abiPath, address, fn, params }) {
  // TODO: abiPath is not actually needed if fn is a signature

  // Parse params (incoming as string)
  params = params ? params.split(',') : [];

  // TODO: Also validate
  if (!address) throw new Error('Address is required');
  if (!abiPath) throw new Error('abiPath is required');
  if (!fn) throw new Error('fn is required');

  debug.log('Interacting with', 'interact');
  debug.log(`abiPath: ${abiPath}`, 'interact');
  debug.log(`address: ${address}`, 'interact');
  debug.log(`fn: ${fn}`, 'interact');
  debug.log(`params: ${params}`, 'interact');

  const abi = loadAbi(abiPath);
  debug.log(abi, 'interact-deep');

  const network = hre.network.config.name || hre.network.name;

  storage.rememberAbiAndAddress(abiPath, address, network);

  // Id signer
  spinner.progress('Connecting signer', 'interact');
  const signer = (await hre.ethers.getSigners())[0];
  const balance = await getBalance(signer.address);
  output.info(`Using signer: ${signer.address} (${balance} ETH)`);
  spinner.success('Connected signer', 'interact');
  if (balance <= 0) {
    await warnWithPrompt(
      'WARNING! Signer balance is 0. You may not be able to send transactions.'
    );
  }

  // Display call signature
  // E.g. "transfer(0x123 /*address _to*/, 42 /*uint256 _amount*/"
  const fnName = fn.split('(')[0];
  const abiFn = abi.find((abiFn) => abiFn.name?.includes(fnName));
  const contractName = path.parse(abiPath).name;
  const sig = getFunctionSignature(abiFn);
  output.info(
    `Calling \`${contractName}.${getPopulatedFunctionSignature(
      abiFn,
      params
    )}\``
  );

  // Double check params
  if (abiFn.inputs.length !== params.length) {
    throw new Error(
      `Invalid number of parameters. Expected ${abiFn.inputs.length}, got ${params.length}`
    );
  }

  // Instantiate the contract
  spinner.progress('Preparing contract', 'interact');
  let contract = await hre.ethers.getContractAt(abi, address);
  contract = contract.connect(signer);
  spinner.success('Contract instantiated', 'interact');
  debug.log(`Instantiated contract: ${contract.target}`, 'interact');

  // Make the call
  const isReadOnly =
    abiFn.stateMutability === 'view' || abiFn.stateMutability === 'pure';
  if (isReadOnly) {
    spinner.progress(`Reading contract`, 'interact');

    let result;
    if (params.length > 0) {
      result = await contract[sig](...params);
    } else {
      result = await contract[sig]();
    }

    spinner.success('Contract read successful', 'interact');

    output.result(`Result: ${result}`);
  } else {
    // Send value?
    let valueETH = 0;
    const isPayable = abiFn.payable || abiFn.stateMutability === 'payable';
    if (isPayable) {
      output.info('This function is payable...');
      const prompt = new Input({
        message: 'How much ETH do you want to send?',
      });
      valueETH = await prompt.run().catch(() => process.exit(0));
      output.info(`Sending ${valueETH} ETH`);
    }

    // Estimate gas
    spinner.progress('Estimating gas', 'interact');
    let estimateGas;
    try {
      estimateGas = await contract[fn].estimateGas(...params);
      spinner.success(`Gas estimated: ${estimateGas}`, 'interact');
    } catch (err) {
      spinner.fail('Gas estimation failed', 'interact');
      throw new Error(
        `Execution reverted during gas estimation: ${err.message}`
      );
    }

    // Prompt the user for confirmation
    // TODO: Also calculate ETH cost for gas and warn loudly if high
    const prompt = new Confirm({
      message: 'Do you want to proceed with the call?',
    });
    const response = await prompt.run().catch(() => process.exit(0));
    if (!response) return;

    spinner.progress('Sending transaction', 'interact');

    const txParams = {};
    if (isPayable) txParams.value = hre.ethers.parseEther(valueETH);

    const tx = await contract[fn](...params, txParams);
    output.info(`Sending transaction: ${tx.hash}`);

    spinner.progress('Mining transaction', 'interact');

    // Wait for the transaction to be mined
    const receipt = await tx.wait();

    // Present tx receipggt
    debug.log(JSON.stringify(receipt, null, 2), 'interact-deep');
    output.info(`Transaction mined!`);
    output.info(`Gas used: ${receipt.gasUsed.toString()}`);
    output.info(`Gas price: ${receipt.gasPrice.toString()}`);
    output.info(`Block number: ${receipt.blockNumber}`);
    output.info(
      `Resulting signer balance: ${await getBalance(signer.address)}`
    );

    if (receipt.status === 0) {
      spinner.fail('Transaction reverted', 'interact');

      throw new Error(`Transaction mined but execution reverted: ${receipt}`);
    } else {
      spinner.success('Transaction mined successfully');

      // Display events
      const events = receipt.logs.map((log) =>
        contract.interface.parseLog(log)
      );
      if (events.length > 0) {
        output.info(`Emitted ${events.length} events:`);
        events.forEach((event) => {
          debug.log(event, 'interact-deep');

          const eventAbi = abi.find((item) => item.name === event.name);

          output.info(`${getFullEventSignature(eventAbi, event)}`);
        });
      } else {
        output.info('Emitted no events');
      }
    }
  }
}

async function getBalance(address) {
  return hre.ethers.formatEther(await hre.ethers.provider.getBalance(address));
}

async function warnWithPrompt(message) {
  output.warn(message);
  const prompt = new Confirm({
    message: 'Continue anyway?',
  });
  const response = await prompt.run().catch(() => process.exit(0));
  if (!response) process.exit(0);
}

// Specialized prompts for each param
call.paramDefinitions.abiPath.prompt = abiPathPrompt;
call.paramDefinitions.address.prompt = addressPrompt;
call.paramDefinitions.fn.prompt = fnPrompt;
call.paramDefinitions.params.prompt = paramsPrompt;
