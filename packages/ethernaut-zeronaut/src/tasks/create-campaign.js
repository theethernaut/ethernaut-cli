const types = require('ethernaut-common/src/validation/types')
const output = require('ethernaut-common/src/ui/output')
const { getChainId } = require('ethernaut-common/src/util/network')
const { connect } = require('../internal/connect')

require('../scopes/zeronaut')
  .task('create-campaign', 'Creates a new campaign')
  .addPositionalParam(
    'name',
    'The name of the campaign',
    undefined,
    types.string,
  )
  .setAction(async ({ name }, hre) => {
    try {
      const chainId = await getChainId(hre)
      const contract = await connect(`chain-${chainId}`, hre)

      const id = hre.ethers.encodeBytes32String(name)
      const tx = await contract.createCampaign(id)
      await tx.wait()

      return output.resultBox(`Created campaign ${name}`)
    } catch (err) {
      return output.errorBox(err)
    }
  })