const _ = require('lodash')

const { mockRobot, mockGithub, mockApi } = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const getReviews = require('./api/getReviews')
const statusSuccess = require('./payloads/statusSuccess')

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
  describe('status', () => {
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
      expect(github.repos.createStatus).toHaveBeenCalledTimes(2)
      expect(github.repos.createStatus).toHaveBeenCalledWith({
        'context': 'prowl/merge',
        'description': 'Prowl is stalking this PR...',
        'owner': 'tommilligan',
        'repo': 'prowl-target-stage',
        'sha': 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72',
        'target_url': 'https://github.com/tommilligan/prowl-github-app#use',
        'state': 'pending'
      })
      expect(github.repos.createStatus).toHaveBeenCalledWith({
        'context': 'prowl/merge',
        'description': 'Ready for merge.',
        'owner': 'tommilligan',
        'repo': 'prowl-target-stage',
        'sha': 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72',
        'target_url': 'https://github.com/tommilligan/prowl-github-app#use',
        'state': 'success'
      })
    })
    it('triggers status when not ready', async () => {
      const reviews = _.cloneDeep(getReviews)
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
      expect(github.repos.createStatus).toHaveBeenCalledTimes(2)
      expect(github.repos.createStatus).toHaveBeenCalledWith({
        'context': 'prowl/merge',
        'description': 'Not ready for merge.',
        'owner': 'tommilligan',
        'repo': 'prowl-target-stage',
        'sha': 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72',
        'target_url': 'https://github.com/tommilligan/prowl-github-app#use',
        'state': 'failure'
      })
      expect(github.issues.createComment).toHaveBeenCalledTimes(0)
    })
    // it('command merge (in status mode) triggers comment when not ready', async () => {
    //   const reviews = _.cloneDeep(getReviews)
    //   reviews.data[0].state = 'CHANGES_REQUESTED'
    //   github.pullRequests.getReviews = mockApi(reviews)
    //   robot = mockRobot(github)

    //   const commandMod = _.cloneDeep(commandStatus)
    //   commandMod.payload.comment.body = 'prowl merge'
    //   await robot.receive(commandMod)
    //   expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    //   expect(github.repos.createStatus).toHaveBeenCalledTimes(2)
    //   expect(github.issues.createComment).toHaveBeenCalledTimes(1)
    // })
  })
})
