const yaml = require('js-yaml')
const uniq = require('lodash.uniq')

const actions = require('../actions')
const commentBodies = require('../commentBodies')
const utils = require('./utils')

/**
 * Decide what merge method we should use later
 * If no values given, `squash` will be used
 * If more than one method is given, an error will be thrown.
 * @param {} targets
 */
function summariseMergeMethod (targets) {
  const mergeMethods = uniq(
    targets
      .map(target => target.tactic.merge_method)
      // filter out falsey values like undefined
      .filter(m => m)
  )

  if (mergeMethods.length === 1) {
    return mergeMethods[0]
  } else if (mergeMethods.length === 0) {
    return 'squash'
  } else {
    throw new Error(`More than one merge_method was specified: ${mergeMethods}`)
  }
}

/**
 * Summarise a .prowl.yml with multiple targets into one internal config
 * relevant to the current PR.
 * @param {*} targets
 */
function summariseTargets (targets) {
  return {
    checkDelay: (Math.max(...targets.map(target => target.pounce.check_delay || 0)) || 0) * 1000,
    delete: targets.every(target => target.tactic.delete),
    dryRun: targets.some(target => target.tactic.dry_run),
    ids: targets.map(target => target.id),
    mergeMethod: summariseMergeMethod(targets),
    reviewerGroups: targets
      .map(target => target.pounce.reviewers)
      .filter(reviewers => {
        return reviewers && reviewers.length > 1
      }),
    stalk: targets.length > 0
  }
}

/**
 * Given the existing pr and raw config, calculate which targets match
 * @param {*} prowl
 * @returns {False | config}
 */
async function calculatePRConfig (prowl, config) {
  const { context, pr } = prowl

  // Get files changed in this pr
  const { data: dirtyFiles } = await context.github.pullRequests.getFiles(
    context.repo({ number: pr.number, per_page: 100 })
  )
  const dirtyFilePaths = dirtyFiles.map(f => f.filename)

  // Filter targets from the config
  const targetsMatched = config.targets
    // by base
    .filter(target => {
      return pr.base.ref === target.stalk.base
    })
    // by filepath
    .filter(target => {
      return utils.minimatchCartesian(dirtyFilePaths, target.stalk.paths, {
        dot: true
      })
    })
  context.log.info(
    `${pr.url}: matches targets ${JSON.stringify(
      targetsMatched.map(t => t.id)
    )}`
  )

  // Summarise targets succintly
  const prConfig = summariseTargets(targetsMatched)
  return prConfig
}

/**
 * Run the specified function with the given {...prowl, config}
 * @param {function} fn Function to call on event
 * @param {object} args Additional params for fn
 */
module.exports = async (fn, prowl, ...args) => {
  const { context, pr } = prowl
  context.log.debug('fetching config')

  // Only get prowl config from default branch
  const fileref = context.repo({ path: '.prowl.yml' })
  const result = await context.github.repos.getContent(fileref)
  const { data: configFile } = result

  if (configFile.type !== 'file') {
    context.log.warn(`${pr.url}: No .prowl.yml found`)
  } else {
    try {
      context.log.debug('reading config')

      const buf = Buffer.from(configFile.content, configFile.encoding)
      const config = yaml.safeLoad(buf.toString('utf8'))
      const prConfig = await calculatePRConfig(prowl, config)

      context.log.info(`${pr.url}: moving to logic`)
      return fn(
        {
          ...prowl,
          config: prConfig
        },
        ...args
      )
    } catch (e) {
      context.log.warn(e)
      context.log.warn(`${pr.url}: Error loading prowl config`)
      actions.prComment(prowl, commentBodies.error({
        event: context.event,
        pr: pr.url,
        message: e.message
      }))
    }
  }
}
