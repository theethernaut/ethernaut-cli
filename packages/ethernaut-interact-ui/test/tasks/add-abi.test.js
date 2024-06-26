const { Terminal } = require('ethernaut-common/src/test/terminal')

describe('add-abi ui', function () {
  const terminal = new Terminal()

  before('interact', async function () {
    await terminal.run('hardhat interact add-abi', 4000)
  })

  it('shows query', async function () {
    terminal.has('Select a file or directory')
  })

  it('shows back nav', async function () {
    terminal.has('..')
  })

  it('shows home dir abbreviation', async function () {
    terminal.has('~')
  })
})
