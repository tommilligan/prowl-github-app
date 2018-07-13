const pj = require('../package.json')

const constants = require('./constants')

const { version } = pj

function isOwnContext (context) {
  return context.split('/')[0] === constants.APP_NAME
}

function ownContext (s) {
  return [constants.APP_NAME, s].join('/')
}

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

module.exports = {
  isOwnContext,
  ownContext,
  sleep,
  version
}
