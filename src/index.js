/**
 * This is the interface to probot.
 * GitHub events trigger prowl events.
 */

const events = require('./events')

module.exports = robot => {
  robot.log.info('App started. Prowling...')

  // log all events we hear
  robot.on(`*`, async context => {
    context.log(`event: ${context.event}`)
  })

  // event specific listeners
  robot.on('issue_comment.created', async context => {
    events.issueComment({ robot, context })
  })
  robot.on('pull_request_review.submitted', async context => {
    events.pullRequestReview({ robot, context })
  })
  robot.on('status', async context => {
    events.status({ robot, context })
  })
}
