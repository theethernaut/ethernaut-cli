const { types } = require('hardhat/config')
const output = require('common/src/output')

const units = ['ether', 'wei', 'kwei', 'mwei', 'gwei', 'szabo', 'finney']

require('../scopes/util')
  .task(
    'unit',
    `Converts between different units of Ether. E.g. 1 ether is 1000000000000000000 wei. Units can be one of ${units.join(
      ',',
    )}.`,
  )
  .addPositionalParam('value', 'The value to convert', undefined, types.string)
  .addOptionalParam('from', 'The unit to convert from', 'ether', types.string)
  .addOptionalParam('to', 'The unit to convert to', 'wei', types.string)
  .setAction(async ({ value, from, to }, hre) => {
    try {
      const valueWei = hre.ethers.parseUnits(value, from)
      let result = hre.ethers.formatUnits(valueWei, to)

      const removeTrailingZeroes = /^0*(\d+(?:\.(?:(?!0+$)\d)+)?)/
      result = result.match(removeTrailingZeroes)[1]

      return output.resultBox(result)
    } catch (err) {
      return output.errorBox(err)
    }
  })

module.exports = {
  units,
}