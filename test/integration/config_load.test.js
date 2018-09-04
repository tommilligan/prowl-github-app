const { mockRobot, mockGithub, mockApi } = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const statusSuccess = require('./payloads/statusSuccess')

describe('loading .prowl.yml', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('valid file', () => {
    it('actions merge', async () => {
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
    })
  })

  describe('invalid file', () => {
    it('missing file fails silently', async () => {
      github.repos.getContent = jest.fn().mockRejectedValue('some error getting the prowl yml file')
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
    })
    it('invalid config fails loudly', async () => {
      // Trigger bad event payload
      const config = getContentConfig(`
version: '0.1.0'
spam:
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(statusSuccess)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
  })
})
