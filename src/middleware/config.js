const yaml = require("js-yaml");

const utils = require("./utils");

/**
 * Run the specified function with the given {...prowl, config}
 * @param {function} fn Function to call on event
 * @param {object} args Additional params for fn
 */
module.exports = async (fn, prowl, ...args) => {
  const { robot, context, pr } = prowl;
  robot.log.debug("fetching config");

  // Only get prowl config from default branch
  const fileref = context.repo({ path: ".prowl.yml" });
  const result = await context.github.repos.getContent(fileref);
  const { data: config_file } = result;

  if (config_file.type !== "file") {
    robot.log.warn(`${pr.url}: No .prowl.yml found`);
  } else {
    try {
      robot.log.debug("reading config");

      buf = Buffer.from(config_file.content, config_file.encoding);
      const config = yaml.safeLoad(buf.toString("utf8"));
      const pr_configs = config.pull_requests;

      const { data: dirtyFiles } = await context.github.pullRequests.getFiles(
        context.repo({ number: pr.number, per_page: 100 })
      );
      const dirtyFilePaths = dirtyFiles.map(f => f.filename);

      // filter configs
      let pr_configs_matched = pr_configs;
      // by base
      pr_configs_matched = pr_configs_matched.filter(pr_config => {
        return pr.base.ref === pr_config.spec.base;
      });
      // by filepaths
      pr_configs_matched = pr_configs_matched.filter(pr_config => {
        return utils.minimatchCartesian(dirtyFilePaths, pr_config.spec.paths, {
          dot: true
        });
      });

      // summarise configs
      const final_config = pr_configs_matched.reduce(
        (acc, config) => {
          const r = acc.reviewerGroups.slice();
          const { reviewers } = config.constrain;
          if (reviewers && reviewers.length > 0) {
            r.push(reviewers);
          }
          return {
            reviewerGroups: r
          };
        },
        { reviewerGroups: [] }
      );

      return fn(
        {
          ...prowl,
          config: final_config
        },
        ...args
      );
    } catch (e) {
      robot.log.error("Error loading prowl config");
      robot.log.error(e);
    }
  }
};
