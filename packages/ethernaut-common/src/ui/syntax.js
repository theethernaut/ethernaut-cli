const camelToKebabCase = require('ethernaut-common/src/util/kebab')
const debug = require('ethernaut-common/src/ui/debug')
const EthernautCliError = require('ethernaut-common/src/error/error')

module.exports = function toCliSyntax(task, args, program = 'ethernaut') {
  debug.log(
    `Converting to CLI syntax: ${task.name}, args: ${JSON.stringify(args)}`,
    'common',
  )

  const tokens = []
  if (program.length > 0) tokens.push(program)

  if (task.scope) tokens.push(task.scope)
  tokens.push(task.name)

  Object.entries(args).forEach(([name, value]) => {
    if (value === undefined) return

    // Is it a non positional param (thus an option)?
    let isOption
    let paramDef = Object.values(task.paramDefinitions).find(
      (p) => p.name === name,
    )
    if (paramDef) isOption = true
    // Or is it a positional param?
    else paramDef = task.positionalParamDefinitions.find((p) => p.name === name)

    // Its not to be one or the other
    if (!paramDef) {
      throw new EthernautCliError(
        'ethernaut-common',
        `No definition found for parameter ${name}, and task ${task.name}, with args ${JSON.stringify(args, null, 2)}`,
      )
    }

    // Is it a flag (boolean option)
    const isFlag = paramDef.isFlag

    // Options are preceded by their --name
    if (isOption) {
      name = `--${camelToKebabCase(name)}`
      // But flags are only shown if their value is true
      if (!isFlag) {
        tokens.push(name)
      } else {
        if (value === true) {
          tokens.push(name)
        }
      }
    }

    // Now, unless its a flag, push the value
    if (!isFlag) {
      const regex = /[ '"?*&|()<>;{}!$]/
      const needsQuotes = regex.test(value)
      if (needsQuotes) {
        tokens.push(`'${value}'`)
      } else {
        tokens.push(`${value}`)
      }
    }
  })

  return tokens.join(' ')
}
