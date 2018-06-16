const commentBodies = require("./commentBodies");
const utils = require("./utils");
const withConfig = require("./middleware/config");

const checkDelay = 1000;

const merge_pr = async prowl => {
  const { robot, context, pr } = prowl;
  robot.log.info(`merge: pr${pr.number}`);

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
    robot.log.info(`merge: pr${pr.number} successfull`);
  } else {
    robot.log.error(`merge: pr${pr.number} failed`);
  }
};

const pr_status = async prowl => {
  const { robot, context, config, pr } = prowl;
  robot.log.info(`head: pr${pr.number} ${pr.head.sha}`);

  robot.log.info(`delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

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
  const params = context.repo({ ref: pr.head.sha });
  const { data } = await context.github.repos.getCombinedStatusForRef(params);
  conditions.push({
    description: "Commit status success",
    value: data.state === "success"
  });

  robot.log.info(conditions);
  return conditions;
};

const check_pr = async prowl => {
  const { robot, context, config, pr } = prowl;
  robot.log.info(`head: pr${pr.number} ${pr.head.sha}`);

  robot.log.info(`delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  const conditions = await pr_status(prowl);
  const prReady = conditions.every(condition => condition.value);
  robot.log.info(`pr: ready ${prReady}`);
  return prReady;
};

const merge_pr_if_ready = async prowl => {
  if (await check_pr(prowl)) {
    return merge_pr(prowl);
  }
};

const pr_comment = async prowl => {
  const { robot, context, config, pr } = prowl;
  const { issue, comment } = context.payload;
  if (issue.pull_request) {
    // if this is a pull request

    robot.log.info(`comment: pr${issue.number} ${comment.body}`);

    const args = comment.body.split(" ");
    const command = args.shift();
    const subcommand = args.shift();

    // if this is a prowl trigger
    if (command === "prowl" && subcommand) {
      // get the current pr
      const { data: pr } = await context.github.pullRequests.get(
        context.issue()
      );

      switch (subcommand) {
        case "approve": {
          // post a response
          if (comment.user.login === "tommilligan") {
            const params = context.issue({
              body: commentBodies.approvedBy(comment.user.login)
            });
            context.github.issues.createComment(params);

            merge_pr_if_ready(prowl);
          } else {
            const params = context.issue({
              body: commentBodies.unauthorized(comment.user.login)
            });
            context.github.issues.createComment(params);
          }
          break;
        }
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
    }
  } else {
    robot.log.info("Comment was not on a PR");
  }
};

module.exports = {
  check_pr,
  pr_comment,
  merge_pr,
  merge_pr_if_ready,
  pr_status
};
