const _ = require('lodash')

const { mockRobot, mockGithub } = require('./utils')

const commandStatus = require('./payloads/issueCommentCreated')

describe('comment commands', () => {
  let robot
  let github

  beforeEach(() => {
    // Happy path - no modifications to github
    github = mockGithub()
    robot = mockRobot(github)
  })

  describe('valid commands should all reply with comment', () => {
    it('config', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl config'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
    it('id', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl id'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
    it('merge', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl merge'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
    it('status', async () => {
      await robot.receive(commandStatus)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
      expect(github.pullRequests.get).toHaveBeenCalledTimes(2)
    })
    it('touch', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl touch'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
      expect(github.pullRequests.get).toHaveBeenCalledTimes(2)
    })
    it('version', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl version'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
  })
  describe('invalid commands', () => {
    it('invalid subcommand should reply with error', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl spam'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
    it('normal comment should have no reply', async () => {
      const commandMod = _.cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'spam'
      await robot.receive(commandMod)
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
    })
  })
})
