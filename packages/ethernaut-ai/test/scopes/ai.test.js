const assert = require('assert')

describe('ai', function () {
  it('has an "ai" scope', async function () {
    assert.notEqual(hre.scopes['ai'], undefined)
  })
})
