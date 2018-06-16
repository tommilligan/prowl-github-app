const yaml = require("js-yaml");

const utils = require("./utils");

/**
 * Run the specified function with the given {...prowl, config}
 * @param {function} fn Function to call on event
 * @param {object} args Additional params for fn
 */
module.exports = async (fn, prowl, ...args) => {
  const { robot, context, pr } = prowl;
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
      const pr_configs = config.pull_requests;

      const { data: dirtyFiles } = await context.github.pullRequests.getFiles(
        context.repo({ number: pr.number, per_page: 100 })
      );
      const dirtyFilePaths = dirtyFiles.map(f => f.filename);

      // filter configs
      const pr_configs_matched = pr_configs.filter(pr_config => {
        return utils.minimatchCartesian(dirtyFilePaths, pr_config.include, {
          dot: true
        });
      });

      return fn(
        {
          ...prowl,
          config: pr_configs_matched
        },
        ...args
      );
    } catch (e) {
      robot.log.error("Error loading prowl config");
      robot.log.error(e);
    }
  }
};
