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

const withConfig = require('./middleware/config')
const logic = require('./logic')

const issueComment = async prowl => {
  const { context } = prowl
  const { issue, comment } = context.payload
  if (issue.pull_request) {
    // if this is a pull request comment (not an issue)
    // look for a prowl command
    const args = comment.body.split(' ')
    const command = args.shift()
    const subcommand = args.shift()

    if (command === 'prowl' && subcommand) {
      // if this is a prowl trigger
      // get the current pr
      const { data: pr } = await context.github.pullRequests.get(
        context.issue()
      )
      // and forward for action
      context.log.info(`${pr.url}: command ${comment.body}`)
      return withConfig(
        logic.prowlCommand,
        {
          ...prowl,
          pr
        },
        subcommand
      )
    }
  }
}

const pullRequestReview = async prowl => {
  const { context } = prowl
  const { pull_request: pullRequest, review } = context.payload

  if (review.state === 'approved' && pullRequest.state === 'open') {
    const { data: pr } = await context.github.pullRequests.get(
      context.repo({
        number: pullRequest.number
      })
    )
    context.log.info(`${pr.url}: ${review.user.login} ${review.state}`)
    return withConfig(logic.prMergeTry, { ...prowl, pr })
  }
}

const pullRequest = async prowl => {
  const { context } = prowl
  const { pull_request: pr, action } = context.payload

  if (pr.state === 'open') {
    context.log.info(`${pr.url}: ${action} ${pr.state}`)

    return withConfig(logic.prMergeTry, { ...prowl, pr })
  }
}

const status = async prowl => {
  const { context } = prowl
  const { state, sha, repository } = context.payload
  const repo = repository.full_name

  if (state === 'success') {
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
        context.log.info(
          `${pr.url}: HEAD (${sha.slice(0, 7)}) status ${state}`
        )
        return withConfig(logic.prMergeTry, { ...prowl, pr })
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
