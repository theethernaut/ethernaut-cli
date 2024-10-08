const { SiweMessage } = require('siwe')

const domain = 'com.ethernaut.cli'
const uri = 'https://github.com/eternauta1337/ethernaut-cli'

function createSiweMessage(address, statement, nonce) {
  const siweMessage = new SiweMessage({
    domain,
    address,
    statement,
    uri,
    version: '1',
    chainId: '1  ',
    nonce,
  })

  return siweMessage.prepareMessage()
}

module.exports = {
  createSiweMessage,
}
