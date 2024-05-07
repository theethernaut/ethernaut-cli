const axios = require('axios')
const debug = require('ethernaut-common/src/ui/debug')
const EthernautCliError = require('ethernaut-common/src/error/error')
const RetroFunding = require('./RetroFunding')
const Delegation = require('./Delegation')
const Proposals = require('./Proposals')
const Contracts = require('./Contracts')
const Auth = require('./Auth')
const Votes = require('./Votes')

const BASE_URL = 'https://vote.optimism.io/api/v1'

// See API spec at https://vote.optimism.io/api_v1
// API categories split into sub-objects.

class Agora {
  constructor() {
    this.bearerToken = process.env.AGORA_BEARER_TOKEN

    this.retro = new RetroFunding(this)
    this.delegation = new Delegation(this)
    this.proposals = new Proposals(this)
    this.contracts = new Contracts(this)
    this.auth = new Auth(this)
    this.votes = new Votes(this)
  }

  async getSpec() {
    return this.createRequest('/spec')
  }

  async createRequest(
    endpoint,
    method = 'GET',
    body = {},
    successStatus = 200,
  ) {
    const url = `${BASE_URL}${endpoint}`

    debug.log(`Requesting ${url}`, 'retropgf')

    const config = {
      method,
      url,
      headers: {
        Authorization: `Bearer ${this.bearerToken}`,
      },
      responseType: 'json',
      body,
    }

    const response = await axios(config)

    if (response.status !== successStatus) {
      throw new EthernautCliError(
        'ethernaut-retropgf',
        `Http status error: ${response.status}`,
      )
    }

    debug.log(`Response ${JSON.stringify(response.data, null, 2)}`, 'retropgf')

    return response.data
  }
}

module.exports = Agora