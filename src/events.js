const withConfig = require("./middleware/config");

const actions = require("./actions");

const issue_comment = async prowl => {
  const { robot, context } = prowl;
  const { issue, comment } = context.payload;
  if (issue.pull_request) {
    // if this is a pull request comment (not an issue)
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
      robot.log.info(`${pr.url}: command ${comment.body}`);
      withConfig(actions.pr_comment, {
        ...prowl,
        pr
      });
    }
  }
};

const pull_request_review = async prowl => {
  const { robot, context } = prowl;
  const { pull_request, review } = context.payload;

  if (review.state === "approved" && pull_request.state === "open") {
    const { data: pr } = await context.github.pullRequests.get(
      context.repo({
        number: pull_request.number
      })
    );
    robot.info(`${pr.url}: ${review.user.login} ${review.state}`);
    withConfig(actions.merge_pr_if_ready, { ...prowl, pr });
  }
};

const status = async prowl => {
  const { robot, context } = prowl;
  const { state, sha, repository } = context.payload;
  const repo = repository.full_name;

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
      const { data: pr } = await context.github.pullRequests.get(
        context.repo({
          number: item.number
        })
      );

      // action if our commit is the HEAD
      if (sha === pr.head.sha) {
        robot.log.info(`${pr.url}: HEAD (${sha.slice(0, 7)}) status ${state}`);
        withConfig(actions.merge_pr_if_ready, { ...prowl, pr });
      }
    });
  }
};

module.exports = {
  issue_comment,
  pull_request_review,
  status
};
