const {mockRobot, mockGithub, mockApi} = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const statusSuccess = require('./payloads/statusSuccess')

describe('stale PR', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('action', () => {
    it('default behaviour triggers merge', async () => {
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
      expect(github.repos.createStatus).toHaveBeenCalledTimes(0)
    })
    it('action status triggers status', async () => {
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
      action: status
      auto_pounce: true
      check_delay: 0
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.repos.createStatus).toHaveBeenCalledTimes(1)
    })
  })
})
