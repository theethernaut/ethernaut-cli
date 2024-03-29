const output = require('ethernaut-common/src/ui/output')
const storage = require('../internal/storage')
const EthernautCliError = require('ethernaut-common/src/error/error')

require('../scopes/wallet')
  .task('current', 'Shows which wallet is active')
  .setAction(async () => {
    try {
      const signers = storage.readSigners()
      if (Object.keys(signers).length < 2) {
        throw new EthernautCliError(
          'ethernaut-wallet',
          'No wallets found. Please use the create task to add one.',
        )
      }

      const signer = signers[signers.activeSigner]
      if (!signer) {
        throw new EthernautCliError(
          'ethernaut-wallet',
          'No active wallet found. Please use the activate task to set one.',
        )
      }

      return output.resultBox(
        `The current wallet is "${signers.activeSigner}" with address ${signer.address}`,
      )
    } catch (err) {
      return output.errorBox(err)
    }
  })
