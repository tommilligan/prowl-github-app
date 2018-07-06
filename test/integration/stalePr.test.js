const {mockRobot, mockGithub, mockApi} = require('./utils')

const pullRequestReopened = require('./payloads/pullRequestReopened')

const pullRequestUpstream = require('./api/pullRequest')
pullRequestUpstream.data.head.sha = '0123456789abcdefghijklmnopqrstuvwxyzABCD'

describe('stale PR', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
    // When getting secondary PR check, return a different head SHA
    github.pullRequests.get = mockApi(pullRequestUpstream)
    robot = mockRobot(github)
  })

  describe('pr opening', () => {
    it('checks pr with inline data', async () => {
      await robot.receive(pullRequestReopened)
      expect(github.search.issues).toHaveBeenCalledTimes(0)
      expect(github.pullRequests.get).toHaveBeenCalledTimes(1)
      // Will not merge as the original PR mock doesnt match sha
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
  })
})
