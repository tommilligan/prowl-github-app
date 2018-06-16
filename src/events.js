const withConfig = require("./middleware/config");

const actions = require("./actions");

const issue_comment = async prowl => {
  const { robot, context } = prowl;
  const { issue, comment } = context.payload;
  if (issue.pull_request) {
    // if this is a pull request comment (not an issue)

    robot.log.info(`comment: pr${issue.number} ${comment.body}`);

    // look for a prowl command
    const args = comment.body.split(" ");
    const command = args.shift();
    const subcommand = args.shift();

    if (command === "prowl" && subcommand) {
      // if this is a prowl trigger
      // get the current pr
      const { data: pr } = await context.github.pullRequests.get(
        context.issue()
      );
      // and forward for action
      withConfig(actions.pr_comment, {
        ...prowl,
        pr
      });
    }
  }
};

const status = async prowl => {
  const { robot, context } = prowl;
  const { state, sha, repository } = context.payload;
  const repo = repository.full_name;

  robot.log.info(`status: ${repo} ${sha.slice(0, 7)} ${state}`);

  if (state === "success") {
    // if the status update was a success
    // search for PRs containing the commit
    q = `${sha} repo:${repo} type:pr`;
    const prs = await context.github.search.issues({
      q: sha,
      sort: "updated",
      order: "desc"
    });

    // for each PR
    prs.data.items.forEach(async item => {
      const { data: pr } = await context.github.pullRequests.get({
        owner: repository.owner.login,
        repo: repository.name,
        number: item.number
      });

      const freshness = s => {
        robot.log.info(`Status on pr${pr.number} is ${s}`);
      };

      // action if our commit is the HEAD
      if (sha === pr.head.sha) {
        freshness("fresh");
        withConfig(actions.merge_pr_if_ready, { ...prowl, pr });
      } else {
        freshness("stale");
      }
    });
  }
};

module.exports = {
  issue_comment,
  status
};
