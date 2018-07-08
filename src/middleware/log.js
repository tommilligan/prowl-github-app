
/**
 * Add log to the prowl object. Requires the pr property to be set
 * @param {function} fn Function to call on event
 */
module.exports = function (prowl) {
  const { context, pr } = prowl

  // Generate child logger with metadata
  const meta = {
    number: pr.number,
    owner: pr.base.repo.owner.login,
    repo: pr.base.repo.name
  }
  meta.id = [meta.owner, meta.repo, meta.number].join('/')
  const log = context.log.child({
    pr: meta
  })
  log.debug('Generated log child')

  return {
    ...prowl,
    log
  }
}
