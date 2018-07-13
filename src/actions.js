/**
 * Actions recieve the full prowl context.
 * They respond directly to the API.
 *
 * They should use `context.repo` as the original event may
 * not contain valid `context.issue` data.
 *
 * If config.dryRun is true, other actions will be
 * replaced with comments.
 */
const urlJoin = require('url-join')

const commentBodies = require('./commentBodies')

// Dry actions

/**
 * Note that no config is required to post a comment.
 * This is **critical**, as it provides a way for us to
 * expose errors with configuration back to the end user.
 * @param {*} prowl
 * @param {*} body
 */
async function prComment (prowl, body) {
  const { context, pr } = prowl
  const { number } = pr

  prowl.log.info(`commenting '${body.slice(0, 16)}...'`)
  return context.github.issues.createComment(
    context.repo({
      number,
      body
    })
  )
}

async function prError (prowl, e) {
  prowl.log.warn(e)
  prowl.log.warn(`Error loading prowl config`)
  prComment(prowl, commentBodies.error({
    event: prowl.context.event.event,
    pr: prowl.pr.url,
    message: e.message
  }))
}

/**
 * If we're not in dryRun, call action. Otherwise, comment message.
 */
async function wetRun (prowl, action, message) {
  const { pr } = prowl
  if (!prowl.config.dryRun) {
    prowl.log.info(`${message}`)
    return action()
  } else {
    const payload = {
      configUrl: urlJoin(pr.base.repo.html_url, 'blob/master/.prowl.yml'),
      prUrl: pr.url,
      time: new Date().toISOString(),
      message
    }
    await prComment(prowl, commentBodies.dryRun(payload))
    return null
  }
}

// Wet actions

async function prStatus (prowl, status) {
  const { context, pr } = prowl

  const message = `set status '${status.context}: ${status.state}'`
  return wetRun(
    prowl,
    async function () {
      return context.github.repos.createStatus(
        context.repo({
          ...status,
          sha: pr.head.sha
        })
      )
    },
    message
  )
}

async function prDelete (prowl) {
  const { context, pr } = prowl
  const { ref } = pr.head

  const qualifiedRef = `heads/${ref}`
  const message = `delete ref ${ref}`

  return wetRun(
    prowl,
    async function () {
      return context.github.gitdata.deleteReference(
        context.repo({ ref: qualifiedRef })
      )
    },
    message
  )
}

async function prMerge (prowl) {
  const { context, pr, config } = prowl

  const message = `merge PR ${pr.number}`
  const merge = context.repo({
    number: pr.number,
    commit_title: `${pr.title} (#${pr.number})`,
    sha: pr.head.sha,
    merge_method: config.mergeMethod
  })

  const result = await wetRun(
    prowl,
    async function () {
      return context.github.pullRequests.merge(merge)
    },
    message
  )

  if (result && result.data && result.data.merged) {
    prowl.log.debug(`merge successful`)
    if (config.delete) {
      await prDelete(prowl)
    }
  } else {
    prowl.log.warn(`merge failed`)
    prowl.log.warn(result)
  }
}

module.exports = {
  prComment,
  prDelete,
  prError,
  prMerge,
  prStatus
}
