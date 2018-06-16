const actions = require("./actions");
const withConfig = require("./config");

module.exports = robot => {
  robot.log("Yay, the app was loaded!");
  robot.on(`*`, async context => {
    robot.log(`Event: ${context.event}`);
  });
  robot.on(["issue_comment.created"], async context => {
    withConfig(actions.comment_command, { robot, context });
  });
  robot.on("status", async context => {
    const { state, sha, repository } = context.payload;
    const repo = repository.full_name;

    robot.log.info(`status: ${repo} ${sha.slice(0, 7)} ${state}`);

    if (state === "success") {
      q = `${sha} repo:${repo} type:pr`;
      const prs = await context.github.search.issues({
        q: sha,
        sort: "updated",
        order: "desc"
      });

      prs.data.items.forEach(async item => {
        const { data: pr } = await context.github.pullRequests.get({
          owner: repository.owner.login,
          repo: repository.name,
          number: item.number
        });

        const freshness = s => {
          robot.log.info(`Status on pr${pr.number} is ${s}`);
        };
        if (sha === pr.head.sha) {
          freshness("fresh");
          withConfig(actions.check_pr, { robot, context }, pr);
        } else {
          freshness("stale");
        }
      });
    } else {
      robot.log.info("Status was not success");
    }
  });
};
