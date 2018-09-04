const _ = require('lodash')

const { mockRobot, mockGithub, mockApi } = require('./utils')

const getContentConfig = require('./api/getContentConfig')
const pullRequest = require('./api/pullRequest')
const statusSuccess = require('./payloads/statusSuccess')

describe('commit message configuration', () => {
  let robot
  let github

  beforeEach(() => {
    github = mockGithub()
  })

  describe('pr append', () => {
    beforeEach(() => {
      robot = mockRobot(github)
    })
    it('appends pr number', async () => {
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
  })
  describe('clubhouse, no pr append', () => {
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
      auto_pounce: true
      check_delay: 0
      commit_message_parser: clubhouse
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
      merge_method: merge
`
      )
      github.repos.getContent = mockApi(config)
    })
    it('works with branch-like title', async () => {
      const pr = _.cloneDeep(pullRequest)
      pr.data.title = 'Tommilligan/ch1123/some new feature'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'some new feature [ch1123]',
        merge_method: 'merge',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
    })
    it('works with custom title and clubhouse branch name', async () => {
      const pr = _.cloneDeep(pullRequest)
      pr.data.title = 'Custom title'
      pr.data.head.ref = 'tommilligan/ch1123/some-new-feature'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'Custom title [ch1123]',
        merge_method: 'merge',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
    })
    it('works with custom title only', async () => {
      const pr = _.cloneDeep(pullRequest)
      pr.data.title = 'Custom title'
      github.pullRequests.get = mockApi(pr)
      robot = mockRobot(github)
      await robot.receive(statusSuccess)
      expect(github.pullRequests.merge).toHaveBeenCalledWith({
        commit_title: 'Custom title',
        merge_method: 'merge',
        number: 5,
        owner: 'tommilligan',
        repo: 'prowl-target-stage',
        sha: 'ca6b8c30cc278e3ed5727b4dbbc927e033d2fd72'
      })
    })
  })
})
