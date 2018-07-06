const {mockRobot, mockGithub, mockApi} = require('./utils')

const issueCommentCreated = require('./payloads/issueCommentCreated')
const pullRequestReopened = require('./payloads/pullRequestReopened')
const statusSuccess = require('./payloads/statusSuccess')

describe('prowl', () => {
  let robot
  let github

  beforeEach(() => {
    // Happy path - no modifications to github
    github = mockGithub()
    robot = mockRobot(github)
  })

  describe('status', () => {
    it('looks up prs from search', async () => {
      await robot.receive(statusSuccess)
      expect(github.search.issues).toHaveBeenCalledWith({
        order: 'desc',
        q: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72 repo:tommilligan/prowl-target-stage type:pr',
        sort: 'updated'
      })
      expect(github.pullRequests.get).toHaveBeenCalledWith({
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage'
      })
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'Pr 5 (#5)',
        merge_method: 'squash',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
      expect(github.gitdata.deleteReference).toHaveBeenCalledWith({
        owner: 'tommilligan',
        ref: 'heads/pr-5',
        repo: 'prowl-target-stage'
      })
    })
  })

  describe('pr opening', () => {
    it('checks pr with inline data', async () => {
      await robot.receive(pullRequestReopened)
      expect(github.search.issues).toHaveBeenCalledTimes(0)
      expect(github.pullRequests.get).toHaveBeenCalledWith({
        number: 1,
        owner: 'Codertocat',
        repo: 'Hello-World'
      })
      // Will not merge as the original PR mock doesnt match sha
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
  })

  describe('comment command', () => {
    it('responds with a comment', async () => {
      await robot.receive(issueCommentCreated)
      expect(github.pullRequests.get).toHaveBeenCalledWith({
        number: 12,
        owner: 'tommilligan',
        repo: 'prowl-target'
      })
      expect(github.issues.createComment).toHaveBeenCalled()
    })
  })
})
