const spinner = require('ethernaut-common/src/ui/spinner')
const warnWithPrompt = require('../internal/warn-prompt')
const getBalance = require('../internal/get-balance')
const debug = require('ethernaut-common/src/ui/debug')
const EthernautCliError = require('ethernaut-common/src/error/error')

module.exports = async function connectSigner(noConfirm) {
  spinner.progress('Connecting signer', 'interact')

  const signers = await hre.ethers.getSigners()
  if (signers.length === 0) {
    throw new EthernautCliError(
      'ethernaut-interact',
      'No signers available - If you are using the ethernaut-cli, please add one with `ethernaut wallet create`',
    )
  }

  debug.log(`Signers: ${signers.map((s) => s.address).join(', ')}`, 'interact')

  const signer = signers[0]
  const balance = await getBalance(signer.address)

  spinner.success(
    `Connected signer ${signer.address} (${balance} ETH)`,
    'interact',
  )

  if (balance <= 0 && !noConfirm) {
    const response = await warnWithPrompt(
      'WARNING! Signer balance is 0. You may not be able to send transactions.',
    )
    if (response === false) return
  }

  return signer
}
