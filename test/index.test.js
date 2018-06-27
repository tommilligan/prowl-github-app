const { createRobot } = require('probot')
const app = require('../src')

const statusSuccess = require('./payloads/statusSuccess')
const issueCommentCreated = require('./payloads/issueCommentCreated')

describe('prowl', () => {
  let robot
  let github

  beforeEach(() => {
    // Create mock app instance
    robot = createRobot()
    app(robot)

    // Mocked GitHub APL
    github = {
      pullRequests: {
        get: jest.fn().mockReturnValue(Promise.resolve({}))
      },
      search: {
        issues: jest.fn().mockReturnValue(Promise.resolve({}))
      }
    }

    // Passes the mocked out GitHub API into out robot instance
    robot.auth = () => Promise.resolve(github)
  })

  describe('on status success', () => {
    it('searches for prs', async () => {
      await robot.receive(statusSuccess)
      const q = {
        order: 'desc',
        q:
          'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72 repo:tommilligan/prowl-target-stage type:pr',
        sort: 'updated'
      }
      expect(github.search.issues).toHaveBeenCalledWith(q)
    })
  })

  describe('on comment command', () => {
    it('gets pr details', async () => {
      await robot.receive(issueCommentCreated)
      const q = {
        number: 12,
        owner: 'tommilligan',
        repo: 'prowl-target'
      }
      expect(github.pullRequests.get).toHaveBeenCalledWith(q)
    })
  })
})
