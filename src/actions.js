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

const get_config = async (robot, context) => {
  robot.log.info("fetching config");
  robot.log.info("reading config");
  return {};
};

module.exports = {
  check_pr,
  get_config
};
