const actions = require("./actions");
const events = require("./events");

module.exports = robot => {
  robot.log("Yay, the app was loaded!");
  robot.on(`*`, async context => {
    robot.log(`Event: ${context.event}`);
  });
  robot.on(["issue_comment.created"], async context => {
    events.issue_comment({ robot, context });
  });
  robot.on("status", async context => {
    events.status({ robot, context });
  });
};
