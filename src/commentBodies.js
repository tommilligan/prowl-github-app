// Helpers
const jsonBlock = o => `\`\`\`json
${JSON.stringify(o, null, 2)}
\`\`\``

const commentWithJSON = (s, o) => `${s}
${jsonBlock(o)}`

// Comments
const config = o => commentWithJSON(`Config for this PR:`, o)
const dryRun = payload =>
  commentWithJSON(
    `If this wasn't a [dry run](${payload.configUrl}), I would **${
      payload.message
    }**.`,
    payload
  )
const deprecation = (deprecated, newAction, advice) =>
  `**Deprecation Warning**

In future, \`${deprecated}\` will **${newAction}**.

${advice}`
const error = o => commentWithJSON(`An event was not processed due to the following error:`, o)
const mergeUnready = o => commentWithJSON(`This PR is not ready for merge. The following checks failed:`, o)
const pounceStatus = o => commentWithJSON(`Status of this PR:`, o)

module.exports = {
  config,
  deprecation,
  dryRun,
  error,
  mergeUnready,
  pounceStatus
}
