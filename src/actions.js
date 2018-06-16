const commentBodies = require("./commentBodies");
const utils = require("./utils");
const withConfig = require("./middleware/config");

const checkDelay = 1000;

const merge_pr = async prowl => {
  const { robot, context, pr } = prowl;
  robot.log.info(`${pr.url}: merge started`);

  const comment = context.repo({
    number: pr.number,
    body: "PR is ready for merge"
  });
  context.github.issues.createComment(comment);

  const merge = context.repo({
    number: pr.number,
    commit_title: `${pr.title} (#${pr.number})`,
    sha: pr.head.sha,
    merge_method: "squash"
  });
  const result = await context.github.pullRequests.merge(merge);
  if (result && result.data && result.data.merged) {
    robot.log.info(`${pr.url}: merge successful`);
  } else {
    robot.log.warn(`${pr.url}: merge failed`);
  }
};

const pr_status = async prowl => {
  const { robot, context, config, pr } = prowl;

  const conditions = [];

  // get latest PR data
  const { data: prCheck } = await context.github.pullRequests.get(
    context.repo({ number: pr.number })
  );

  // check HEAD hasn't moved
  conditions.push({
    description: "HEAD is fresh",
    value: prCheck.head.sha === pr.head.sha
  });
  // check PR is mergeable
  conditions.push({
    description: "PR is mergeable",
    value: prCheck.mergeable
  });

  // check commit is success
  const {
    data: refStatus
  } = await context.github.repos.getCombinedStatusForRef(
    context.repo({ ref: pr.head.sha })
  );
  conditions.push({
    description: "Commit status success",
    value: refStatus.state === "success"
  });

  // PR reviews
  const { data: prReviews } = await context.github.pullRequests.getReviews(
    context.repo({ number: pr.number, per_page: 100 })
  );
  robot.log.warn(prReviews);
  const approvedReviewers = prReviews
    .filter(review => {
      const { commit_id, state } = review;
      return commit_id === pr.head.sha && state === "APPROVED";
    })
    .map(review => review.user.login);
  robot.log.warn(approvedReviewers);
  const approved = config.reviewerGroups.every(reviewerGroup => {
    return reviewerGroup.some(reviewer => {
      return approvedReviewers.includes(reviewer);
    });
  });
  conditions.push({
    description: "Required reviewers approved",
    value: approved
  });

  return conditions;
};

const check_pr = async prowl => {
  const { robot, context, config, pr } = prowl;

  const conditions = await pr_status(prowl);
  const prReady = conditions.every(condition => condition.value);
  robot.log.info(`${pr.url}: ready? ${prReady}`);
  return prReady;
};

const merge_pr_if_ready = async prowl => {
  const { robot, pr } = prowl;
  robot.log.info(`${pr.url}: delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  if (await check_pr(prowl)) {
    return merge_pr(prowl);
  }
};

const prowl_command = async (prowl, command) => {
  const { robot, context, config, pr } = prowl;
  const { issue, comment } = context.payload;
  switch (command) {
    case "status": {
      conditions = await pr_status(prowl);

      const params = context.issue({
        body: commentBodies.pr_status(conditions)
      });
      context.github.issues.createComment(params);
      break;
    }
    case "config": {
      const params = context.issue({
        body: commentBodies.config(config)
      });
      context.github.issues.createComment(params);
    }
    default: {
      break;
    }
  }
};

module.exports = {
  check_pr,
  prowl_command,
  merge_pr,
  merge_pr_if_ready,
  pr_status
};
