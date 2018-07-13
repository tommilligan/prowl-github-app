const cloneDeep = require('lodash.clonedeep')

const {mockRobot, mockGithub, mockApi} = require('./utils')

const getCombinedStatusForRef = require('./api/getCombinedStatusForRef')
const getReviews = require('./api/getReviews')
const pullRequest = require('./api/pullRequest')

const pullRequestReopened = require('./payloads/pullRequestReopened')

describe('PR merge conditions', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('merges', () => {
    it('happy PR', async () => {
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
  })

  describe('does not merge', () => {
    it('stale PR', async () => {
      // Return a different head SHA
      const pr = cloneDeep(pullRequest)
      pr.data.head.sha = '0123456789abcdefghijklmnopqrstuvwxyzABCD'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('unmergeable PR', async () => {
      // Return a different head SHA
      const pr = cloneDeep(pullRequest)
      pr.data.mergeable = false
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('closed PR', async () => {
      // Return a different head SHA
      const pr = cloneDeep(pullRequest)
      pr.data.state = 'closed'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with no approving reviews when required', async () => {
      // Add another review that is not approved
      const reviews = cloneDeep(getReviews)
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with non success HEAD', async () => {
      // Waiting on CI
      const status = cloneDeep(getCombinedStatusForRef)
      status.data.statuses[0].state = 'pending'
      status.data.statuses[0].context = 'custom-test-status'
      github.repos.getCombinedStatusForRef = mockApi(status)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
  })
})
