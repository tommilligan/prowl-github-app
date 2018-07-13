const cloneDeep = require('lodash.clonedeep')

const {mockRobot, mockGithub, mockApi} = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const getReviews = require('./api/getReviews')
const statusSuccess = require('./payloads/statusSuccess')
const commandStatus = require('./payloads/issueCommentCreated')

describe('action configuration', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('merge (default)', () => {
    it('triggers merge', async () => {
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
      expect(github.repos.createStatus).toHaveBeenCalledTimes(0)
    })
  })
  describe('merge', () => {
    beforeEach(() => {
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
    })

    it('triggers status', async () => {
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.repos.createStatus).toHaveBeenCalledWith({
        'context': 'prowl/merge',
        'description': 'Prowl approves this PR for merge',
        'owner': 'tommilligan',
        'repo': 'prowl-target-stage',
        'sha': 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72',
        'state': 'success'
      })
    })
    it('triggers status when not ready', async () => {
      const reviews = cloneDeep(getReviews)
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.repos.createStatus).toHaveBeenCalledWith({
        'context': 'prowl/merge',
        'description': 'Prowl cannot approve this PR yet',
        'owner': 'tommilligan',
        'repo': 'prowl-target-stage',
        'sha': 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72',
        'state': 'failure'
      })
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
    })
    it('command merge (in status mode) triggers comment when not ready', async () => {
      const reviews = cloneDeep(getReviews)
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      const commandMod = cloneDeep(commandStatus)
      commandMod.payload.comment.body = 'prowl merge'
      await robot.receive(commandMod)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.repos.createStatus).toHaveBeenCalledTimes(1)
      expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    })
  })
})
