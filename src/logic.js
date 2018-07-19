/**
 * Logic handlers recieve a full context with PR and configuration.
 * They are responsible for detemining which actions to perform.
 */

require('dotenv-safe').config()

const _ = require('lodash')

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
    description: 'The HEAD of the PR has changed since this check started',
    id: 'headFresh',
    pass: prCheck.head.sha === pr.head.sha,
    value: pr.head.sha
  })
  // check PR is mergeable
  conditions.push({
    description: 'This PR not mergeable - are there conflicts?',
    id: 'mergeable',
    pass: !!prCheck.mergeable,
    value: prCheck.mergeable
  })
  // check PR is open
  conditions.push({
    description: 'PR is not open',
    id: 'open',
    pass: prCheck.state === 'open',
    value: prCheck.state
  })

  // check commit is success
  const refStatuses = await context.github.paginate(
    context.github.repos.getCombinedStatusForRef(
      context.repo({ ref: pr.head.sha })
    ),
    res => res.data.statuses
  )
  const refStatusSuccess = refStatuses
    .filter(refStatus => !utils.isOwnContext(refStatus.context))
    .every(refStatus => refStatus.state === 'success')
  conditions.push({
    description: 'The PR\'s HEAD commit status is not success (excludes prowl statuses)',
    id: 'statusSuccess',
    pass: refStatusSuccess,
    value: refStatusSuccess
  })

  // PR reviews
  // get from API
  const prReviews = await context.github.paginate(
    context.github.pullRequests.getReviews(
      context.repo({ number: pr.number, per_page: 100 })
    ),
    res => res.data
  )
  // filter to approved only
  let approvedReviewers = prReviews
    .filter(review => {
      const { commit_id: commitId, state } = review
      return commitId === pr.head.sha && state === 'APPROVED'
    })
    .map(review => review.user.login)
  // add author as a reviewer if author_implicit_reviewer is set
  if (config.author_implicit_reviewer) {
    approvedReviewers.push(pr.user.login)
  }
  // check this generated list against configuration
  const unapprovedGroups = config.reviewerGroups.filter(reviewerGroup => {
    return !reviewerGroup.reviewers.some(reviewer => {
      return approvedReviewers.includes(reviewer)
    })
  })
  const approved = unapprovedGroups.length === 0
  const description = unapprovedGroups.reduce(
    (desc, group) => {
      const descReviewers = group.reviewers.reduce((rs, reviewer) => `${rs}\n    - ${reviewer}`, '')
      return `${desc}\n  - ${group.id}${descReviewers}`
    },
    'This PR requires more reviews. At least one person from each group is required:'
  )
  conditions.push({
    description,
    id: 'reviewersApproved',
    pass: approved,
    value: approvedReviewers
  })

  // PR labels
  const notReadyLabels = prCheck.labels
    .map(label => label.name)
    .filter(label => _.includes(config.not_ready_labels, label))
  conditions.push({
    description: 'PR is labelled as in progress',
    id: 'labelWip',
    pass: notReadyLabels.length < 1,
    value: notReadyLabels
  })

  return conditions
}

const conditionsCheck = (prowl, conditions) => {
  prowl.log.debug(`checking conditions ${JSON.stringify(conditions)}`)
  return conditions.every(condition => condition.pass)
}

/**
 * Try to merge the given PR. If success, null will be returned.
 * If failure, an array of failed conditions will be returned
 * @param {*} prowl
 * @param {boolean} auto If this is a manual merge command
 */
const prMergeTry = async (prowl, command = false) => {
  const { config } = prowl
  const { checkDelay, stalk } = config

  if (
    // There are applicable rules for this PR
    stalk &&
    // We were commanded or auto_pounce is enabled
    (command || config.auto_pounce)
  ) {
    // Immediately set pending status
    switch (config.action) {
      case 'status': {
        const status = {
          state: 'pending',
          description: 'Prowl is stalking this PR...',
          context: utils.ownContext('merge')
        }
        await actions.prStatus(prowl, status)
        break
      }
    }

    prowl.log.info(`delaying check for ${checkDelay}ms`)
    await utils.sleep(checkDelay)

    const conditions = await prPounceStatus(prowl)
    const prReady = conditionsCheck(prowl, conditions)

    if (prReady) {
      prowl.log.info(`ready for merge`)
      switch (config.action) {
        case 'merge': {
          await actions.prMerge(prowl)
          break
        }
        case 'status': {
          const status = {
            state: 'success',
            description: 'Ready for merge. `prowl merge` to execute.',
            context: utils.ownContext('merge')
          }
          await actions.prStatus(prowl, status)
          break
        }
      }
    } else {
      // Configured action
      switch (config.action) {
        case 'status': {
          const status = {
            state: 'failure',
            description: 'Not ready for merge. `prowl status` for details, `prowl touch` to recheck.',
            context: utils.ownContext('merge')
          }
          await actions.prStatus(prowl, status)
          break
        }
      }
      prowl.log.info(`not ready for merge`)
    }
  }
}

const prowlCommand = async (prowl, command) => {
  const { config } = prowl
  switch (command) {
    case 'config': {
      return actions.prComment(prowl, commentBodies.config(config))
    }
    case 'debug': {
      const conditions = await prPounceStatus(prowl)
      return actions.prComment(prowl, commentBodies.pounceStatus(conditions))
    }
    case 'id': {
      return actions.prComment(
        prowl,
        `GitHub app id is \`${process.env.APP_ID}\``
      )
    }
    case 'merge': {
      return actions.prComment(prowl, commentBodies.deprecation(
        'prowl merge',
        'will merge the PR without confirmation',
        'Please use `prowl status` instead.'
      ))
    }
    case 'status': {
      const conditions = await prPounceStatus(prowl)
      const failedConditions = conditions
        .filter(condition => !condition.pass)
      if (failedConditions.length > 0) {
        await actions.prComment(prowl, commentBodies.mergeUnready(failedConditions))
      } else {
        await actions.prComment(
          prowl,
          'PR looks ready for merge. Use `prowl touch` to trigger a full check.'
        )
      }
      return null
    }
    case 'touch': {
      // act as if we just had another event of some kind
      await prMergeTry(prowl)
      return null
    }
    case 'version': {
      return actions.prComment(
        prowl,
        `Version running is \`${utils.version}\``
      )
    }
    default: {
      throw Error(`Invalid prowl subcommand '${utils.command}'`)
    }
  }
}

module.exports = {
  prowlCommand,
  prMergeTry
}
