const pj = require('../package.json')

const { version } = pj

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  sleep,
  version
}
