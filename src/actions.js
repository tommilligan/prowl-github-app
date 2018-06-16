const utils = require("./utils");

const checkDelay = 1000;

const check_pr = async (robot, context, pr) => {
  robot.log.info(`head: pr${pr.number} ${pr.head.sha}`);

  robot.log.info(`delaying check for ${checkDelay}ms`);
  await utils.sleep(checkDelay);

  const params = context.repo({ ref: pr.head.sha });
  const { data } = await context.github.repos.getCombinedStatusForRef(params);
  robot.log.info(`head: pr${pr.number} ${data.state}`);

  if (data.state === "success") {
    robot.log.info("pr is ready to go");
    const comment = context.repo({
      number: pr.number,
      body: "PR is ready for merge"
    });
    context.github.issues.createComment(comment);
  } else {
    robot.log.info("pr is not ready yet");
  }
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
