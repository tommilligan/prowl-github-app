const yaml = require('js-yaml')
const _ = require('lodash')

const actions = require('../actions')
const utils = require('./utils')

/**
 * Decide what merge method we should use later
 * If no values given, `squash` will be used
 * If more than one method is given, an error will be thrown.
 * @param {} targets
 */
function uniqueConfigValue (targets, k, defaultValue) {
  const values = _.uniq(
    targets
      .map(target => _.get(target, k) || defaultValue)
      // filter out falsey values like undefined
      .filter(v => v)
  )

  if (values.length === 1) {
    return values[0]
  } else if (values.length === 0) {
    return defaultValue
  } else {
    throw new Error(`More than one value was specified for ${k}: ${values}`)
  }
}

/**
 * Summarise a .prowl.yml with multiple targets into one internal config
 * relevant to the current PR.
 * @param {*} targets
 */
function summariseTargets (targets) {
  return {
    action: uniqueConfigValue(targets, 'pounce.action', 'merge'),
    author_implicit_reviewer: targets.every(target => target.pounce.author_implicit_reviewer),
    auto_pounce: targets.every(target => target.pounce.auto_pounce),
    checkDelay: Math.max(...targets.map(target => {
      const { check_delay: delay } = target.pounce
      return (delay === undefined) ? 5 : delay
    })) * 1000,
    commit_message_parser: uniqueConfigValue(targets, 'pounce.commit_message_parser', null),
    commit_message_pr_number: targets.every(target => target.pounce.commit_message_pr_number),
    delete: targets.every(target => target.pounce.delete !== false),
    dryRun: targets.some(target => target.pounce.dry_run),
    ids: targets.map(target => target.id),
    mergeMethod: uniqueConfigValue(targets, 'pounce.merge_method', 'squash'),
    not_ready_labels: _.uniq(_.flatMap(targets, target => target.pounce.not_ready_labels || [])),
    reviewerGroups: targets
      .filter(target => {
        const { reviewers } = target.pounce
        return reviewers && reviewers.length > 0
      })
      .map(target => {
        return {
          id: target.id,
          reviewers: target.pounce.reviewers
        }
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
  const dirtyFiles = await context.github.paginate(
    context.github.pullRequests.getFiles(
      context.repo({ number: pr.number, per_page: 100 })
    ),
    res => res.data
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
  prowl.log.info(
    `matches targets ${JSON.stringify(
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
  const { context } = prowl

  // Only get prowl config from default branch
  const fileref = context.repo({ path: '.prowl.yml' })

  // We don't care about errors here - this app isn't using prowl
  try {
    const result = await context.github.repos.getContent(fileref)
    const { data: configFile } = result

    if (configFile.type !== 'file') {
      throw Error(`.prowl.yml found, but was not a file`)
    }

    // Now we care about errors
    try {
      prowl.log.debug('reading config')

      let prConfig
      try {
        const buf = Buffer.from(configFile.content, configFile.encoding)
        const config = yaml.safeLoad(buf.toString('utf8'))
        prConfig = await calculatePRConfig(prowl, config)
      } catch (e) {
        prowl.log.warn(e)
        throw Error('Malformed .prowl.yml configuration file')
      }

      prowl.log.info(`Moving to logic`)
      await fn(
        {
          ...prowl,
          config: prConfig
        },
        ...args
      )
    } catch (e) {
      actions.prError(prowl, e)
    }
  } catch (e) {
    prowl.log.info('Prowl not set up correctly')
    prowl.log.info(e)
  }
}
