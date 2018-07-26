/**
 * This is the interface to probot.
 * GitHub events trigger prowl events.
 */

const actions = require('./actions')
const events = require('./events')
const utils = require('./utils')

module.exports = robot => {
  robot.log.info(`App started. v${utils.version} prowling...`)

  // log all events we hear
  robot.on(`*`, async context => {
    context.log(`event: ${context.event.event}`)
    await actions.logRateLimitThrottled({robot, context})
  })

  // event specific listeners
  robot.on('issue_comment.created', async context => {
    return events.issueComment({ robot, context })
  })
  robot.on('pull_request_review.submitted', async context => {
    return events.pullRequestReview({ robot, context })
  })
  robot.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.labeled',
    'pull_request.unlabeled',
    'pull_request.synchronize',
    'pull_request.review_requested',
    'pull_request.review_request_removed'
  ], async context => {
    return events.pullRequest({ robot, context })
  })
  robot.on('status', async context => {
    return events.status({ robot, context })
  })
}
