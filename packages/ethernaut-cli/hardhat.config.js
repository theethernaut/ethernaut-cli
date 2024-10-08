const figlet = require('figlet')
const chalkAnimation = require('chalk-animation')
const pkg = require('./package.json')
const storage = require('ethernaut-common/src/io/storage')
const { refreshEnv } = require('ethernaut-common/src/io/env')
const {
  queryTelemetryConsent,
} = require('ethernaut-common/src/error/telemetry')
const checkAutoUpdate = require('./src/update')

refreshEnv()

require('@nomicfoundation/hardhat-ethers')

// Order matters
// AI goes first, so that other packages can inject assistant instructions
require('ethernaut-ai')
require('ethernaut-util')
require('ethernaut-util-ui')
require('ethernaut-interact')
require('ethernaut-interact-ui')
require('ethernaut-network')
require('ethernaut-network-ui')
require('ethernaut-wallet')
require('ethernaut-wallet-ui')
require('ethernaut-challenges')
require('ethernaut-ui')
require('ethernaut-oso')
require('ethernaut-ai-ui')
require('ethernaut-optigov')

async function main() {
  const txt = figlet.textSync('ethernaut-cli', { font: 'Graffiti' })
  chalkAnimation.rainbow(txt).render()
  console.log(
    `v${pkg.version} - Warning!!! BETA version. Please report issues here ${pkg.bugs.url}`,
  )

  storage.init()

  await queryTelemetryConsent()
  await checkAutoUpdate(pkg)
}
main()

module.exports = {
  solidity: '0.8.19',
  defaultNetwork: 'localhost',
  ethernaut: {
    ui: {
      exclude: [
        'vars/*',
        'check',
        'compile',
        'clean',
        'flatten',
        'test',
        'navigate',
        'run',
        'node',
        'help',
        'console',
      ],
    },
  },
}
