const utils = require("./utils");

const checkDelay = 1000;

const merge_pr = async (robot, context, pr) => {
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

const check_pr = async (robot, context, pr) => {
  robot.log.info(`head: pr${pr.number} ${pr.head.sha}`);

  robot.log.info(`delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  // check HEAD hasn't moved
  const { data: pr_check } = await context.github.pullRequests.get(
    context.repo({ number: pr.number })
  );
  if (pr_check.head.sha === pr.head.sha) {
    robot.log.info(`head is still at ${pr.head.sha}`);

    // check commit is success
    const params = context.repo({ ref: pr.head.sha });
    const { data } = await context.github.repos.getCombinedStatusForRef(params);

    if (data.state === "success") {
      robot.log.info(`head is ${data.state}`);

      if (false) {
        return merge_pr(robot, context, pr_check);
      }
    }
  }

  robot.log.info("pr is not ready yet");
};

const comment_command = async args => {
  const { robot, context, config } = args;
  const { issue, comment } = context.payload;
  if (issue.pull_request) {
    // if this is a pull request

    robot.log.info(`comment: pr${issue.number} ${comment.body}`);

    const args = comment.body.split(" ");
    const command = args.shift();
    const subcommand = args.shift();

    // if this is a prowl trigger
    if (command === "prowl" && subcommand) {
      const config = await actions.get_config(robot, context);

      switch (subcommand) {
        case "approve":
          // post a response
          if (comment.user.login === "tommilligan") {
            const params = context.issue({
              body: `Thanks ${comment.user.login} - I'll merge when ready`
            });
            context.github.issues.createComment(params);

            // get the current pr
            const { data: pr } = await context.github.pullRequests.get(
              context.issue()
            );
            actions.check_pr(robot, context, pr);
          } else {
            const params = context.issue({
              body: `Apologies @${
                comment.user.login
              } - you are not authorized to approve this PR`
            });
            context.github.issues.createComment(params);
          }
          break;
        default:
          break;
      }
    }
  } else {
    robot.log.info("Comment was not on a PR");
  }
};

module.exports = {
  check_pr,
  comment_command,
  merge_pr
};
