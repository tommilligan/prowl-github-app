const approvedBy = s => `Thanks ${s} - I'll merge when ready`;

const pr_status = conditions => `Status of this PR:
\`\`\`json
${JSON.stringify(conditions, null, 2)}
\`\`\`
`;

const unauthorised = s =>
  `Apologies @${s} - you are not authorized to approve this PR`;

module.exports = {
  pr_status,
  unauthorised
};
