const storage = require('ethernaut-interact/src/internal/storage')
const {
  EtherscanApi,
  getEtherscanUrl,
} = require('ethernaut-interact/src/internal/etherscan')
const { prompt } = require('ethernaut-common/src/ui/prompt')
const spinner = require('ethernaut-common/src/ui/spinner')
const debug = require('ethernaut-common/src/ui/debug')
const { getChainId } = require('ethernaut-common/src/util/network')
const { checkEnvVar } = require('ethernaut-common/src/io/env')
const { browse } = require('ethernaut-common/src/ui/browse')

const strategies = {
  ETHERSCAN: 'Fetch from Etherscan',
  BROWSE: 'Browse known ABIs',
  BROWSE_FS: 'Browse file system',
  MANUAL: 'Enter path manually',
}

module.exports = async function promptAbi({ hre, address }) {
  try {
    let abi

    const chainId = await getChainId(hre)

    // Let the user select a strategy
    const choice = await selectStrategy(address, chainId)
    debug.log(`Chosen strategy: ${choice}`, 'interact')

    // Execute the chosen strategy
    switch (choice) {
      case strategies.BROWSE:
        abi = await browseKnownAbis()
        break
      case strategies.BROWSE_FS:
        abi = await browse()
        break
      case strategies.ETHERSCAN:
        abi = await getAbiFromEtherscan(address, chainId)
        break
      case strategies.MANUAL:
      // Do nothing
    }

    // Remember anything?
    // Note: The abi file is stored below when fetching from Etherscan
    if (abi && address) {
      storage.rememberAbiAndAddress(abi, address, chainId)
    }

    return abi
  } catch (err) {
    debug.log(err, 'interact')
  }
}

async function selectStrategy(address, chainId) {
  // Collect available choices since
  // not all strategies might be available
  const choices = [strategies.MANUAL, strategies.BROWSE_FS, strategies.BROWSE]

  // Fetch from Etherscan?
  const etherscanUrl = getEtherscanUrl(chainId)
  if (address && etherscanUrl) {
    choices.push(strategies.ETHERSCAN)
  } else {
    debug.log('Cannot fetch from Etherscan', 'interact')
  }

  // Show prompt
  debug.log(`Prompting for strategy - choices: ${choices}`, 'interact')

  return await prompt({
    type: 'select',
    message: 'How would you like to specify an ABI?',
    choices,
  })
}

async function browseKnownAbis() {
  const abiFiles = storage.readAbiFiles()

  const choices = abiFiles.map((file) => ({
    message: file.name,
    value: file.path,
  }))

  return await prompt({
    type: 'autocomplete',
    message: 'Pick an ABI',
    limit: 10,
    suggest: (input, choices) => {
      return choices.filter((choice) => {
        return choice.message.toLowerCase().includes(input.toLowerCase())
      })
    },
    choices,
  })
}

async function getAbiFromEtherscan(address, chainId) {
  await checkEnvVar(
    'ETHERSCAN_API_KEY',
    'This key is required to fetch ABIs from Etherscan',
  )

  spinner.progress('Fetching ABI from Etherscan...', 'etherscan')

  const etherscanUrl = getEtherscanUrl(chainId)
  debug.log(`Etherscan URL: ${etherscanUrl}`, 'etherscan')

  const etherscan = new EtherscanApi(
    process.env.ETHERSCAN_API_KEY,
    etherscanUrl,
  )

  try {
    const info = await etherscan.getContractCode(address)
    const abi = storage.storeAbi(info.ContractName, info.ABI)

    spinner.success(
      `Abi fetched from Etherscan ${info.ContractName}`,
      'etherscan',
    )

    return abi
  } catch (err) {
    spinner.fail(
      `Unable to fetch ABI from Etherscan: ${err.message}`,
      'etherscan',
    )

    debug.log(err.message, 'etherscan')
  }
}
