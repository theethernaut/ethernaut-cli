const axios = require('axios')
const debug = require('ethernaut-common/src/ui/debug')
const EthernautCliError = require('ethernaut-common/src/error/error')
const API_BASE_URL = 'https://vote.optimism.io/api/v1'

class Auth {
  constructor() {}

  // Get a nonce from the Agora API
  async getNonce() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/nonce`)

      debug.log(`Nonce: ${response.data.nonce}`, 'ethernaut-optigov')
      return response.data
    } catch (error) {
      throw new EthernautCliError(
        'ethernaut-optigov',
        `Http status error: ${error.message}`,
      )
    }
  }

  // Authenticate with the Agora API
  async authenticateWithAgora(message, signature, nonce) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/auth/verify`,
        {
          message,
          signature,
          nonce,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      debug.log('Auth Response Status:', response.status)
      // save the Bearer token
      this.bearerToken = response.data.access_token
      return response.data.access_token
    } catch (error) {
      if (error.response) {
        // Server responded with a status other than 2xx
        throw new EthernautCliError(
          'ethernaut-optigov',
          `Http status error: ${error.response.data}`,
        )
      } else {
        // Other errors (e.g., network issue)
        throw new EthernautCliError(
          'ethernaut-optigov',
          `Http status error: ${error.message}`,
        )
      }
    }
  }
}

module.exports = Auth
