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
const url = require("url");

const commentBodies = require("./commentBodies");

// Dry actions

async function prComment(prowl, body) {
  const { context, pr } = prowl;
  const { number } = pr;

  return context.github.issues.createComment(
    context.repo({
      number,
      body
    })
  );
}

/**
 * If we're not in dryRun, call action. Otherwise, comment message.
 */
async function wetRun(prowl, action, message) {
  const { context, pr } = prowl;
  if (!prowl.config.dryRun) {
    context.log.info(`${pr.url}: ${message}`);
    return action();
  } else {
    const payload = {
      configUrl: url.resolve(pr.base.repo.html_url, "/blob/master/.prowl.yml"),
      prUrl: pr.url,
      time: new Date().toISOString(),
      message
    };
    prComment(prowl, commentBodies.dryRun(payload));
    return null;
  }
}

// Wet actions

async function prDelete(prowl) {
  const { context, pr, config } = prowl;
  const { ref } = pr.head;

  const qualifiedRef = `heads/${ref}`;
  const message = `deleted ref ${ref}`;

  return wetRun(
    prowl,
    async function() {
      return context.github.gitdata.deleteReference(
        context.repo({ ref: qualifiedRef })
      );
    },
    message
  );
}

async function prMerge(prowl) {
  const { context, pr } = prowl;

  const message = `merged PR ${pr.number}`;
  const merge = context.repo({
    number: pr.number,
    commit_title: `${pr.title} (#${pr.number})`,
    sha: pr.head.sha,
    merge_method: "squash"
  });

  const result = await wetRun(
    prowl,
    async function() {
      context.github.pullRequests.merge(merge);
    },
    message
  );

  if (result && result.data && result.data.merged) {
    context.log.info(`${pr.url}: merge successful`);
    await delete_pr(prowl);
  } else {
    context.log.warn(`${pr.url}: merge failed`);
  }
}

module.exports = {
  prComment,
  prDelete,
  prMerge
};
