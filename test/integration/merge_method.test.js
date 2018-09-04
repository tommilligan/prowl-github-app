const { mockRobot, mockGithub, mockApi } = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const statusSuccess = require('./payloads/statusSuccess')

describe('merge method configuration', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('merge_method', () => {
    it('default behaviour triggers squash', async () => {
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'Pr 5 (#5)',
        merge_method: 'squash',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
    })
    it('merge triggers merge', async () => {
      // Trigger bad event payload
      const config = getContentConfig(`
version: '0.1.0'
targets:
  - id: markdown
    stalk:
      paths:
        - "**/*.md"
      base: master
    pounce:
      auto_pounce: true
      check_delay: 0
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
      merge_method: merge
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'Pr 5',
        merge_method: 'merge',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
    })
  })
})
