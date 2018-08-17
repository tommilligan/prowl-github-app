const _ = require('lodash')

const {mockRobot, mockGithub, mockApi} = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const getCombinedStatusForRef = require('./api/getCombinedStatusForRef')
const getReviewRequests = require('./api/getReviewRequests')
const getReviews = require('./api/getReviews')
const pullRequest = require('./api/pullRequest')

const pullRequestReopened = require('./payloads/pullRequestReopened')

describe('PR merge conditions', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('merges', () => {
    it('happy PR', async () => {
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
  })

  describe('does not merge', () => {
    it('stale PR', async () => {
      // Return a different head SHA
      const pr = _.cloneDeep(pullRequest)
      pr.data.head.sha = '0123456789abcdefghijklmnopqrstuvwxyzABCD'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('unmergeable PR', async () => {
      // Return a different head SHA
      const pr = _.cloneDeep(pullRequest)
      pr.data.mergeable = false
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('closed PR', async () => {
      // Return a different head SHA
      const pr = _.cloneDeep(pullRequest)
      pr.data.state = 'closed'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with no approving reviews when required', async () => {
      // Modify review to be not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with an outstanding review, even though not required', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data.push(_.cloneDeep(reviews.data[0]))
      reviews.data[1].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with comments only is classified as a fail', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data[0].state = 'COMMENTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with comments additionally is classified as a pass', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data.push(_.cloneDeep(reviews.data[0]))
      reviews.data[1].state = 'COMMENTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
    it('failing reviews are superceeded by new same user reviews', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data.push(_.cloneDeep(reviews.data[0]))
      reviews.data[0].state = 'CHANGES_REQUESTED'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
    it('failing reviews are not superceeded by new different user reviews', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviews)
      reviews.data.push(_.cloneDeep(reviews.data[0]))
      reviews.data[0].state = 'CHANGES_REQUESTED'
      reviews.data[0].user.login = 'spam'
      github.pullRequests.getReviews = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with an outstanding review request', async () => {
      // Add another review that is not approved
      const reviews = _.cloneDeep(getReviewRequests)
      reviews.data.users.push({
        login: 'octocat'
      })
      github.pullRequests.getReviewRequests = mockApi(reviews)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with non success HEAD', async () => {
      // Waiting on CI
      const status = _.cloneDeep(getCombinedStatusForRef)
      status.data.statuses[0].state = 'pending'
      status.data.statuses[0].context = 'custom-test-status'
      github.repos.getCombinedStatusForRef = mockApi(status)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR with WIP label', async () => {
      // Return with a new label
      const pr = _.cloneDeep(pullRequest)
      pr.data.labels[0].name = 'WIP'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR that requires multiple reviewers', async () => {
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
      commit_message_pr_number: true
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
      reviewer_count: 9000
      not_ready_labels:
        - WIP
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(0)
    })
    it('PR that requires 0 reviewers will always pass', async () => {
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
      commit_message_pr_number: true
      reviewers:
        - spam
      reviewer_count: 0
      not_ready_labels:
        - WIP
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
    it('PR with nested teams should pass', async () => {
      const config = getContentConfig(`
version: '0.1.0'

_team0: &team0
  - bar
  - foo
_team1: &team1
  - tommilligan
  - spam

targets:
  - id: markdown
    stalk:
      paths:
        - "**/*.md"
      base: master
    pounce:
      auto_pounce: true
      check_delay: 0
      commit_message_pr_number: true
      reviewers:
        - *team0
        - *team1
      not_ready_labels:
        - WIP
`
      )
      github.repos.getContent = mockApi(config)
      robot = mockRobot(github)

      await robot.receive(pullRequestReopened)
      expect(github.pullRequests.merge).toHaveBeenCalledTimes(1)
    })
  })
})
