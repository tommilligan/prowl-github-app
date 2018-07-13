/**
 * Events are triggered by an incoming prowl object, {robot, context}
 * They are responsible for:
 *   - deciding if the incoming event is relevant
 *   - identifying a linked PR (if any)
 *   - forwarding prowl context such that {...prowl, pr},
 *     where pr has been retrieved from the GitHub API
 *   - applying withConfig middleware
 *   - forwarding to a logical handler
 */

const constants = require('./constants')
const withConfig = require('./middleware/config')
const withLog = require('./middleware/log')
const logic = require('./logic')
const utils = require('./utils')

const issueComment = async prowl => {
  const { context } = prowl
  const { issue, comment } = context.payload
  if (issue.pull_request) {
    // if this is a pull request comment (not an issue)
    // look for a prowl command
    const args = comment.body.split(' ')
    const command = args.shift()
    const subcommand = args.shift()

    if (command === constants.APP_NAME && subcommand) {
      // if this is a prowl trigger
      // get the current pr
      const { data: pr } = await context.github.pullRequests.get(
        context.issue()
      )
      // setup logger
      const prowlWithLog = withLog({
        ...prowl,
        pr
      })
      prowlWithLog.log.info(`Command: ${comment.body}`)
      // and forward for action
      return withConfig(
        logic.prowlCommand,
        prowlWithLog,
        subcommand
      )
    }
  }
}

const pullRequestReview = async prowl => {
  const { context } = prowl
  const { pull_request: pr, review } = context.payload

  if (
    review.state === 'approved' &&
    pr.state === 'open' &&
    // review is at HEAD of the PR
    review.commit_id === pr.head.sha
  ) {
    // setup logger
    const prowlWithLog = withLog({
      ...prowl,
      pr
    })
    prowlWithLog.log.info(`Review: ${review.user.login} ${review.state}`)
    return withConfig(logic.prMergeTry, prowlWithLog)
  }
}

const pullRequest = async prowl => {
  const { context } = prowl
  const { pull_request: pr, action } = context.payload

  if (pr.state === 'open') {
    // if we need to recheck a pr
    // setup logger
    const prowlWithLog = withLog({
      ...prowl,
      pr
    })
    prowlWithLog.log.info(`PR State: ${action} ${pr.state}`)

    return withConfig(logic.prMergeTry, prowlWithLog)
  }
}

const status = async prowl => {
  const { context } = prowl
  const { state, sha, repository } = context.payload
  const repo = repository.full_name

  if (state === 'success' && !utils.isOwnContext(context.payload.context)) {
    // if the status update was a success
    // search for PRs containing the commit
    const q = `${sha} repo:${repo} type:pr`
    const prs = await context.github.paginate(
      context.github.search.issues({
        q,
        sort: 'updated',
        order: 'desc'
      }),
      res => res.data.items
    )

    // for each PR
    const pArray = prs.map(async item => {
      const { data: pr } = await context.github.pullRequests.get(
        context.repo({
          number: item.number
        })
      )

      // action if our commit is the HEAD
      if (sha === pr.head.sha) {
        // setup logger
        const prowlWithLog = withLog({
          ...prowl,
          pr
        })
        prowlWithLog.log.info(
          `HEAD: ${sha.slice(0, 7)} ${state}`
        )
        return withConfig(logic.prMergeTry, prowlWithLog)
      }
    })
    // wait for our async array for testing purposes
    return Promise.all(pArray)
  }
}

module.exports = {
  issueComment,
  pullRequest,
  pullRequestReview,
  status
}
