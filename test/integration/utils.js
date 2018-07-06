
const { createRobot } = require('probot')
const app = require('../../src')

const getCombinedStatusForRef = require('./api/getCombinedStatusForRef')
const getContentConfig = require('./api/getContentConfig')
const getFiles = require('./api/getFiles')
const getReviews = require('./api/getReviews')
const merge = require('./api/merge')
const pullRequest = require('./api/pullRequest')
const searchIssues = require('./api/searchIssues')

/**
 * Factory for mock functions that return a resolved promise
 * @param {*} content
 */
function mockApi (content) {
  return jest.fn().mockReturnValue(Promise.resolve(content))
}

/**
 * Create a mock probot app
 */
function mockRobot (github) {
  const robot = createRobot()
  app(robot)
  // Passes the mocked out GitHub API into out robot instance
  robot.auth = () => Promise.resolve(github)
  return robot
}

/**
 * Mock out our github calls with known good data
 * This can be mutated to return bad data for certain tests
 */
function mockGithub () {
  // Mocked GitHub APL
  const github = {
    gitdata: {
      deleteReference: mockApi({
        did: 'delete ref'
      })
    },
    issues: {
      createComment: mockApi({
        did: 'create comment'
      })
    },
    pullRequests: {
      get: mockApi(pullRequest),
      getFiles: mockApi(getFiles),
      getReviews: mockApi(getReviews),
      merge: mockApi(merge)
    },
    repos: {
      getContent: mockApi(getContentConfig),
      getCombinedStatusForRef: mockApi(getCombinedStatusForRef)
    },
    search: {
      issues: mockApi(searchIssues)
    }
  }
  return github
}

module.exports = {
  mockApi,
  mockGithub,
  mockRobot
}
