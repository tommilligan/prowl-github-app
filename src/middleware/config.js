const yaml = require("js-yaml");

const utils = require("./utils");

/**
 * Given the existing
 * @param {*} prowl
 */
async function calculatePRConfig(prowl, config) {
  const { robot, context, pr } = prowl;

  // Get files changed in this pr
  const { data: dirtyFiles } = await context.github.pullRequests.getFiles(
    context.repo({ number: pr.number, per_page: 100 })
  );
  const dirtyFilePaths = dirtyFiles.map(f => f.filename);

  // Filter rules from the config
  rulesMatched = config.rules
    // by base
    .filter(pr_config => {
      return pr.base.ref === pr_config.spec.base;
    })
    // by filepath
    .filter(pr_config => {
      return utils.minimatchCartesian(dirtyFilePaths, pr_config.spec.paths, {
        dot: true
      });
    });

  // Summarise rules succintly
  const final_config = {
    dryRun: rulesMatched.some(pr_config => pr_config.dryRun),
    reviewerGroups: rulesMatched
      .map(r => r.constrain.reviewers)
      .filter(reviewers => {
        return reviewers && reviewers.length > 1;
      })
  };
}

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
      const prConfig = calculatePRConfig(prowl, config);

      return fn(
        {
          ...prowl,
          config: prConfig
        },
        ...args
      );
    } catch (e) {
      robot.log.error("Error loading prowl config");
      robot.log.error(e);
    }
  }
};
