const storage = require('../../internal/storage');
const debug = require('common/debugger');
const path = require('path');

module.exports = async function prompt({ abiPath, hre }) {
  if (!abiPath) return;

  try {
    const network = hre.network.config.name || hre.network.name;

    const addresses = storage.findAddressWithAbi(abiPath, network);
    debug.log(
      `Addresses used with ${path.basename(abiPath)}: ${addresses}`,
      'interact'
    );

    return addresses;
  } catch (err) {
    debug.log(err);
  }
};
