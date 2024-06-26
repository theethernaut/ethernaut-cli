const { extendEnvironment } = require('hardhat/config')

require('ethernaut-ui/src/index')
require('ethernaut-interact/src/index')

const abiSuggest = require('./suggest/abi')
const abiPrompt = require('./prompts/abi')
const addressSuggest = require('./suggest/address')
const addressSuggestERC20 = require('./suggest/addressERC20')
const fnPrompt = require('./prompts/fn')
const paramsPrompt = require('./prompts/params')
const fnERC20Prompt = require('./prompts/fnERC20')
const paramsERC20Prompt = require('./prompts/paramsERC20')
const eventPrompt = require('./prompts/event')
const paramsLogPrompt = require('./prompts/params-log')
const abiBrowsePrompt = require('./prompts/abi-browse-only')

extendEnvironment((hre) => {
  const contract = hre.scopes.interact.tasks.contract
  contract.paramDefinitions.abi.suggest = abiSuggest
  contract.paramDefinitions.abi.prompt = abiPrompt
  contract.paramDefinitions.address.suggest = addressSuggest
  contract.paramDefinitions.fn.prompt = fnPrompt
  contract.paramDefinitions.params.prompt = paramsPrompt

  const token = hre.scopes.interact.tasks.token
  token.positionalParamDefinitions.find((p) => p.name === 'address').suggest =
    addressSuggestERC20
  token.paramDefinitions.fn.prompt = fnERC20Prompt
  token.paramDefinitions.params.prompt = paramsERC20Prompt

  const logs = hre.scopes.interact.tasks.logs
  logs.paramDefinitions.address.suggest = addressSuggest
  logs.paramDefinitions.abi.prompt = abiPrompt
  logs.paramDefinitions.abi.suggest = abiSuggest
  logs.paramDefinitions.params.prompt = paramsLogPrompt
  logs.paramDefinitions.event.prompt = eventPrompt

  const addAbi = hre.scopes.interact.tasks['add-abi']
  addAbi.positionalParamDefinitions.find((p) => p.name === 'abiPath').prompt =
    abiBrowsePrompt
})
