const cloneDeep = require('lodash.clonedeep')

const {mockRobot, mockGithub} = require('./utils')

const statusSuccess = require('./payloads/statusSuccess')

describe('stale PR', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
    robot = mockRobot(github)
  })

  describe('status', () => {
    it('success triggers issues search', async () => {
      // Trigger bad event payload
      await robot.receive(statusSuccess)
      expect(github.search.issues).toHaveBeenCalledTimes(1)
    })
    it('failure does not trigger issues search', async () => {
      // Trigger bad event payload
      const status = cloneDeep(statusSuccess)
      status.payload.state = 'failure'
      await robot.receive(status)
      expect(github.search.issues).toHaveBeenCalledTimes(0)
    })
    it('pending does not trigger issues search', async () => {
      // Trigger bad event payload
      const status = cloneDeep(statusSuccess)
      status.payload.state = 'pending'
      await robot.receive(status)
      expect(github.search.issues).toHaveBeenCalledTimes(0)
    })
    it('prowl/ namespace status does not trigger issues search', async () => {
      // Trigger bad event payload
      const status = cloneDeep(statusSuccess)
      status.payload.context = 'prowl/spam'
      await robot.receive(status)
      expect(github.search.issues).toHaveBeenCalledTimes(0)
    })
  })
})
