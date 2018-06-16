const commentBodies = require("./commentBodies");
const utils = require("./utils");
const withConfig = require("./middleware/config");

const checkDelay = 1000;

const delete_pr = async prowl => {
  const { robot, context, pr } = prowl;
  const { ref } = pr.head;
  robot.log.info(`${pr.url}: deleting ${ref}`);
  return await context.github.gitdata.deleteReference(context.repo({ ref }));
};

const merge_pr = async prowl => {
  const { robot, context, pr } = prowl;
  robot.log.info(`${pr.url}: merge started`);

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
    pass: prCheck.head.sha === pr.head.sha,
    value: pr.head.sha
  });
  // check PR is mergeable
  conditions.push({
    description: "PR is mergeable",
    pass: !!prCheck.mergeable,
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
    pass: refStatus.state === "success",
    value: refStatus.state
  });

  // PR reviews
  const { data: prReviews } = await context.github.pullRequests.getReviews(
    context.repo({ number: pr.number, per_page: 100 })
  );
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
  robot.log.warn(approved);
  conditions.push({
    description: "Required reviewers approved",
    pass: approved,
    value: [config.reviewerGroups, approvedReviewers]
  });

  return conditions;
};

const conditionsCheck = conditions => {
  return conditions.every(condition => condition.pass);
};

const merge_pr_if_ready = async prowl => {
  const { robot, pr } = prowl;
  robot.log.info(`${pr.url}: delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  const conditions = pr_status(prowl);
  if (prReady) {
    robot.log.info(`${pr.url}: ready for merge`);
    const comment = context.repo({
      number: pr.number,
      body: commentBodies.merge(conditions)
    });
    context.github.issues.createComment(comment);
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
  prowl_command,
  merge_pr,
  merge_pr_if_ready,
  pr_status
};
