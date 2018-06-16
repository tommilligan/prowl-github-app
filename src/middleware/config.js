const yaml = require("js-yaml");

/**
 * Run the specified function with the given {...prowl, config}
 * @param {function} fn Function to call on event
 * @param {object} args Additional params for fn
 */
module.exports = async (fn, prowl, ...args) => {
  const { robot, context } = prowl;
  robot.log.info("fetching config");

  // Only get prowl config from default branch
  const fileref = context.repo({ path: ".prowl.yml" });
  const result = await context.github.repos.getContent(fileref);
  const { data: config_file } = result;

  if (config_file.type !== "file") {
    robot.log.warning("No .prowl.yml found");
  } else {
    robot.log.info("reading config");

    try {
      buf = Buffer.from(config_file.content, config_file.encoding);
      const config = yaml.safeLoad(buf.toString("utf8"));
      robot.log.info(config);

      return fn(
        {
          ...prowl,
          config
        },
        ...args
      );
    } catch (e) {
      robot.log.error("Error loading prowl config");
      robot.log.error(e);
    }
  }
};
