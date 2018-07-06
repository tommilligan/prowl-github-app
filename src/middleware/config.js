const yaml = require('js-yaml')

const utils = require('./utils')

function summariseTargets (targets) {
  return {
    checkDelay: (Math.max(...targets.map(target => target.check_delay || 0)) || 0) * 1000,
    dryRun: targets.some(target => target.dry_run),
    ids: targets.map(target => target.id),
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
      context.log.error('Error loading prowl config')
      context.log.error(e)
    }
  }
}
