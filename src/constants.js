const APP_NAME = 'prowl'
const GITHUB_PR_REVIEWS_STATES = {
  PASS: ['APPROVED'],
  // use !PASS instead
  // FAIL: ['CHANGES_REQUESTED'],
  IGNORE: ['COMMENTED', 'DISMISSED']
}
const LINK_README_COMMANDS = 'https://github.com/tommilligan/prowl-github-app#use'

module.exports = {
  APP_NAME,
  GITHUB_PR_REVIEWS_STATES,
  LINK_README_COMMANDS
}
