// Helpers
const jsonBlock = o => `\`\`\`json
${JSON.stringify(o, null, 2)}
\`\`\``;

const commentWithJSON = (s, o) => `${s}
${jsonBlock(o)}`;

// Comments
const config = o => commentWithJSON(`Prowl config for this PR`, o);
const dryRun = o => (`prowl is treating this PR as a dry run`, o);
const id = s => `prowl app id: \`${s}\``;
const pounceStatus = o => commentWithJSON(`Status of this PR`, o);

module.exports = {
  config,
  dryRun,
  id,
  pounceStatus
};
