/**
 * Logic handlers recieve a full context with PR and configuration.
 * They are responsible for detemining which actions to perform.
 */

require('dotenv-safe').config()

const actions = require('./actions')
const commentBodies = require('./commentBodies')
const utils = require('./utils')

const prPounceStatus = async prowl => {
  const { context, config, pr } = prowl

  const conditions = []

  // get latest PR data
  const { data: prCheck } = await context.github.pullRequests.get(
    context.repo({ number: pr.number })
  )

  // check HEAD hasn't moved
  conditions.push({
    description: 'HEAD is fresh',
    pass: prCheck.head.sha === pr.head.sha,
    value: pr.head.sha
  })
  // check PR is mergeable
  conditions.push({
    description: 'PR is mergeable',
    pass: !!prCheck.mergeable,
    value: prCheck.mergeable
  })
  // check PR is open
  conditions.push({
    description: 'PR is open',
    pass: prCheck.state === 'open',
    value: prCheck.state
  })

  // check commit is success
  const {
    data: refStatus
  } = await context.github.repos.getCombinedStatusForRef(
    context.repo({ ref: pr.head.sha })
  )
  conditions.push({
    description: 'Commit status success',
    pass: refStatus.state === 'success',
    value: refStatus.state
  })

  // PR reviews
  const prReviews = await context.github.paginate(
    context.github.pullRequests.getReviews(
      context.repo({ number: pr.number, per_page: 100 })
    ),
    res => res.data
  )
  const approvedReviewers = prReviews
    .filter(review => {
      const { commit_id: commitId, state } = review
      return commitId === pr.head.sha && state === 'APPROVED'
    })
    .map(review => review.user.login)
  const approved = config.reviewerGroups.every(reviewerGroup => {
    return reviewerGroup.some(reviewer => {
      return approvedReviewers.includes(reviewer)
    })
  })
  conditions.push({
    description: 'Required reviewers approved',
    pass: approved,
    value: {
      approved: approvedReviewers,
      required: config.reviewerGroups
    }
  })

  return conditions
}

const conditionsCheck = (prowl, conditions) => {
  prowl.log.debug(`checking conditions ${JSON.stringify(conditions)}`)
  return conditions.every(condition => condition.pass)
}

const prMergeTry = async prowl => {
  const { config } = prowl
  const { checkDelay, stalk } = config

  if (!stalk) {
    return null
  } else {
    prowl.log.info(`delaying check for ${checkDelay}ms`)
    await utils.sleep(checkDelay)

    const conditions = await prPounceStatus(prowl)
    const prReady = conditionsCheck(prowl, conditions)

    if (prReady) {
      prowl.log.info(`ready for merge`)
      // const comment = context.repo({
      //   number: pr.number,
      //   body: commentBodies.merge(conditions)
      // });
      // context.github.issues.createComment(comment);
      return actions.prMerge(prowl)
    } else {
      prowl.log.info(`not ready for merge`)
    }
  }
}

const prowlCommand = async (prowl, command) => {
  const { config } = prowl
  switch (command) {
    case 'status': {
      const conditions = await prPounceStatus(prowl)
      return actions.prComment(prowl, commentBodies.pounceStatus(conditions))
    }
    case 'config': {
      return actions.prComment(prowl, commentBodies.config(config))
    }
    case 'id': {
      return actions.prComment(prowl, commentBodies.id(process.env.APP_ID))
    }
    default: {
      return null
    }
  }
}

module.exports = {
  prowlCommand,
  prMergeTry
}
