// Helpers
const jsonBlock = o => `\`\`\`json
${JSON.stringify(o, null, 2)}
\`\`\``;

// Comments
const approvedBy = s => `Thanks ${s} - I'll merge when ready`;

const config = c => `Prowl config for this PR:
${jsonBlock(c)}
`;

const pr_status = conditions => `Status of this PR:
${jsonBlock(conditions)}
`;

const unauthorized = s =>
  `Apologies @${s} - you are not authorized to action this PR`;

module.exports = {
  approvedBy,
  config,
  pr_status,
  unauthorized
};
