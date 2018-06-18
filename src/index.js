const events = require("./events");

module.exports = robot => {
  robot.log.info("App started. Prowling...");

  // log all events we hear
  robot.on(`*`, async context => {
    robot.log(`event: ${context.event}`);
  });

  // event specific listeners
  robot.on("issue_comment.created", async context => {
    events.issue_comment({ robot, context });
  });
  robot.on("pull_request_review.submitted", async context => {
    events.pull_request_review({ robot, context });
  });
  robot.on("status", async context => {
    events.status({ robot, context });
  });
};
