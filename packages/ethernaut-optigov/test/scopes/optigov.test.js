const assert = require('assert')

describe('optigov', function () {
  it('has a "optigov" scope', async function () {
    assert.notEqual(hre.scopes['optigov'], undefined)
  })
})
