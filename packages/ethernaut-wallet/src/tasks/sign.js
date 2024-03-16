const types = require('ethernaut-common/src/validation/types')
const output = require('ethernaut-common/src/ui/output')
const storage = require('../internal/storage')
const { getWallet } = require('../internal/signers')

require('../scopes/wallet')
  .task('sign', 'Signs a message with the active wallet')
  .addPositionalParam('message', 'The message to sign', undefined, types.string)
  .setAction(async ({ message }) => {
    try {
      const signers = storage.readSigners()
      const signer = signers[signers.activeSigner]

      const wallet = getWallet(hre, signer.pk)

      return output.resultBox(wallet.signMessageSync(message))
    } catch (err) {
      return output.errorBox(err)
    }
  })
