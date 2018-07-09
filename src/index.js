/**
 * This is the interface to probot.
 * GitHub events trigger prowl events.
 */

const pj = require('../package.json')
const events = require('./events')

module.exports = robot => {
  robot.log.info(`App started. v${pj.version} prowling...`)

  // log all events we hear
  robot.on(`*`, async context => {
    return context.log(`event: ${context.event.event}`)
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
    'pull_request.synchronize'
  ], async context => {
    return events.pullRequest({ robot, context })
  })
  robot.on('status', async context => {
    return events.status({ robot, context })
  })
}
