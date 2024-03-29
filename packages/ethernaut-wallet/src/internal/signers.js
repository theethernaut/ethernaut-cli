const storage = require('./storage')
const output = require('ethernaut-common/src/ui/output')
const EthernautCliError = require('ethernaut-common/src/error/error')

async function setSigner(alias) {
  const signers = storage.readSigners()

  const signer = signers[alias]
  if (!signer) {
    throw new EthernautCliError(
      'ethernaut-wallet',
      `The signer ${alias} does not exist`,
      false,
    )
  }

  signers.activeSigner = alias

  storage.storeSigners(signers)
}

function getWallet(hre, pk) {
  if (pk === undefined) {
    throw new EthernautCliError(
      'ethernaut-wallet',
      'No private key available for this wallet',
    )
  }

  return new hre.ethers.Wallet(pk, hre.ethers.provider)
}

function generatePk(hre) {
  return hre.ethers.Wallet.createRandom().privateKey
}

async function getSigner(address) {
  const signers = storage.readSigners()

  const signer = signers.values.find((signer) => signer.address === address)
  if (!signer) {
    throw new EthernautCliError(
      'ethernaut-wallet',
      `The signer ${address} does not exist`,
      false,
    )
  }

  return getWallet(hre, signer.pk)
}

async function getSigners() {
  const signers = storage.readSigners()
  let activeSigner = signers.activeSigner
  let signersArr = _getSignersArray(signers)

  if (signersArr.length === 0 || !activeSigner) {
    return hre.ethers.getSignersOriginal()
  }

  activeSigner = signers[activeSigner].address

  signersArr = _sortSigners(signersArr, activeSigner)

  return signersArr.map((s) => {
    if (s.pk) return getWallet(hre, s.pk)
    else return hre.ethers.getSignerOriginal(s.address)
  })
}

function _getSignersArray(signers) {
  const arr = []

  Object.entries(signers).forEach(([key, value]) => {
    if (key !== 'activeSigner') {
      arr.push(value)
    }
  })

  return arr
}

function _sortSigners(signers, firstAddress) {
  return signers.sort((a, b) => {
    if (a.address === firstAddress) {
      return -1
    }
    if (b.address === firstAddress) {
      return 1
    }
    return 0
  })
}

function modifySigners(hre) {
  hre.ethers.getSignerOriginal = hre.ethers.getSigner
  hre.ethers.getSignersOriginal = hre.ethers.getSigners
  hre.ethers.getSigners = getSigners
  hre.ethers.getSigner = getSigner
}

function createRandomSigner(hre) {
  const pk = generatePk(hre)
  const wallet = getWallet(hre, pk)

  return {
    address: wallet.address,
    pk,
  }
}

function addSigner(hre, alias, pk) {
  const signers = storage.readSigners()

  const address = getWallet(hre, pk).address
  if (!address) {
    throw new EthernautCliError(
      'ethernaut-wallet',
      `Invalid private key: ${pk}`,
      false,
    )
  }

  signers[alias] = {
    address,
    pk,
  }

  signers.activeSigner = alias

  storage.storeSigners(signers)

  return address
}

function ensureActiveSigner() {
  const signers = storage.readSigners()

  const activeSigner = signers.activeSigner

  if (Object.keys(signers).length < 2) {
    output.warn('No wallets found, please add one with `wallet create`')
    return
  }

  if (
    activeSigner === undefined ||
    activeSigner === 'none' ||
    signers[activeSigner] === undefined
  ) {
    const firstAlias = Object.keys(signers).find(
      (key) => key !== 'activeSigner',
    )
    signers.activeSigner = firstAlias
    storage.storeSigners(signers)
  }
}

module.exports = {
  setSigner,
  getWallet,
  getSigner,
  getSigners,
  modifySigners,
  generatePk,
  ensureActiveSigner,
  addSigner,
  createRandomSigner,
}
