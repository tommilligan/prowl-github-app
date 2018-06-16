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

module.exports = robot => {
  robot.log("Yay, the app was loaded!");
  robot.on(`*`, async context => {
    robot.log(`Event: ${context.event}`);
  });
  robot.on(["issue_comment.created"], async context => {
    const { issue, comment } = context.payload;
    if (issue.pull_request) {
      // if this is a pull request

      robot.log.info(`comment: pr${issue.number} ${comment.body}`);

      // if this is a prowl trigger
      if (comment.body === "prowl approve") {
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
          check_pr(robot, context, pr);
        } else {
          const params = context.issue({
            body: `Apologies @${
              comment.user.login
            } - you are not authorized to approve this PR`
          });
          context.github.issues.createComment(params);
        }
      }
    } else {
      robot.log.info("Comment was not on a PR");
    }
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
          check_pr(robot, context, pr);
        } else {
          freshness("stale");
        }
      });
    } else {
      robot.log.info("Status was not success");
    }
  });
};
