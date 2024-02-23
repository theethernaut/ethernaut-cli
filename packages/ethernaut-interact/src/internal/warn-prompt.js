const prompt = require('common/src/prompt')

module.exports = async function warnWithPrompt(message) {
  output.warn(message)
  const response = await prompt({
    type: 'confirm',
    message: 'Continue anyway?',
  })
  if (!response) process.exit(0)
}
