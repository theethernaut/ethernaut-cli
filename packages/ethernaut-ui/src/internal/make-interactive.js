const { task: hreTask } = require('hardhat/config')
const getNodes = require('ethernaut-common/src/tasks/get-nodes')
const debug = require('ethernaut-common/src/ui/debug')
const output = require('ethernaut-common/src/ui/output')
const collectArguments = require('./collect-args')
const toCliSyntax = require('ethernaut-common/src/ui/syntax')
const getTaskUsage = require('ethernaut-common/src/tasks/usage')
const clipboardy = require('clipboardy')

let _hre

module.exports = function makeHreInteractive(hre) {
  _hre = hre

  makeTasksInteractive(hre)
}

function makeTasksInteractive(scope) {
  getNodes(scope).forEach((node) => {
    if (node.isScope) {
      makeTasksInteractive(node)
    } else if (
      node.name !== 'help' ||
      node.name !== 'version' ||
      node.name !== 'navigate'
    ) {
      makeInteractive(node)
    }
  })
}

function makeInteractive(task) {
  if (
    task.name === 'help' ||
    task.name === 'version' ||
    task.name === 'navigate'
  ) {
    return
  }
  debug.log(`Making task "${task.name}" interactive`, 'ui-deep')

  // Combine all of the task's parameter definitions in the same array,
  // for the operations that follow.
  const paramDefinitions = task.positionalParamDefinitions.concat(
    Object.values(task.paramDefinitions),
  )

  // Make all parameters optional so that hardhat doesn't
  // throw when required task arguments are not provided.
  // We want to collect them interactively.
  for (let paramDef of paramDefinitions) {
    paramDef.originallyOptional = paramDef.isOptional
    paramDef.isOptional = true
  }

  // Also, intercept parsing of parameters because
  // hardhat automatically injects default values into the action's args.
  // We want to identify when this happens so that we still show prompts
  // with the default value merely suggested instead of directly injected.
  const special = (originalType, paramDef) => ({
    name: originalType.name,
    parse: (argName, argValue) => {
      const parsedValue = originalType.parse(argName, argValue)
      paramDef.parsedValue = parsedValue
      debug.log(
        `Parsing "${argName}" - Provided: "${argValue}", Default: "${paramDef.defaultValue}", Parsed: "${parsedValue}"`,
        'ui',
      )
      return parsedValue
    },
    validate: (argName, argValue) => {
      return originalType.validate(argName, argValue)
    },
  })
  for (let paramDef of paramDefinitions) {
    debug.log(`  Modifying parser for param "${paramDef.name}"`, 'ui-deep')
    paramDef.type = special(paramDef.type, paramDef)
  }

  // Override the action so that we can
  // collect parameters from the user before running it
  const action = async (args, hre, runSuper) => {
    // Detect nonInteractive
    let nonInteractive = !!hre.ethernaut?.ui?.nonInteractive
    debug.log(`Detected nonInteractive: ${nonInteractive}`, 'ui')

    if (nonInteractive === false) {
      output.info(`Usage: ${getTaskUsage(task)}`)

      const collectedArgs = await collectArguments(args, task, _hre)
      args = { ...args, ...collectedArgs }

      // If parameters were collected, print out the call
      if (Object.values(collectedArgs).length > 0) {
        const msg = toCliSyntax(task, args)
        clipboardy.writeSync(msg)
        output.info(`Autocompleted: ${msg} (copied to clipboard)`)
      }
    }

    return await runSuper(args, hre, runSuper)
  }

  // Complete the override by calling task()
  // at either the hre or the scope level
  if (task.scope !== undefined) {
    const scope = _hre.scopes[task.scope]
    scope.task(task.name, task.description, action)
  } else {
    hreTask(task.name, task.description, action)
  }
}
