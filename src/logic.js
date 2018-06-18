/**
 * Logic handlers recieve a full context with PR and configuration.
 * They are responsible for detemining which actions to perform.
 */

require("dotenv-safe").config();

const actions = require("./actions");
const commentBodies = require("./commentBodies");
const utils = require("./utils");
const withConfig = require("./middleware/config");

const checkDelay = 1000;

const prPounceStatus = async prowl => {
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
  const approved = config.reviewerGroups.every(reviewerGroup => {
    return reviewerGroup.some(reviewer => {
      return approvedReviewers.includes(reviewer);
    });
  });
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

const prMergeTry = async prowl => {
  const { robot, context, pr } = prowl;
  context.log.info(`${pr.url}: delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  const conditions = await prPounceStatus(prowl);
  const prReady = conditionsCheck(conditions);

  if (prReady) {
    context.log.info(`${pr.url}: ready for merge`);
    // const comment = context.repo({
    //   number: pr.number,
    //   body: commentBodies.merge(conditions)
    // });
    // context.github.issues.createComment(comment);
    return merge_pr(prowl);
  } else {
    context.log.info(`${pr.url}: not ready for merge`);
  }
};

const prowlCommand = async (prowl, command) => {
  const { config } = prowl;
  switch (command) {
    case "status": {
      conditions = await prPounceStatus(prowl);
      actions.prComment(prowl, commentBodies.pounceStatus(conditions));
      break;
    }
    case "config": {
      actions.prComment(prowl, commentBodies.config(config));
      break;
    }
    case "id": {
      actions.prComment(prowl, commentBodies.id(process.env.APP_ID));
      break;
    }
    default: {
      break;
    }
  }
};

module.exports = {
  prowlCommand,
  prMergeTry
};
