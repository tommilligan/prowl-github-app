const yaml = require("js-yaml");

const utils = require("./utils");

function summariseTargets(targets) {
  return {
    dryRun: targets.some(target => target.dry_run),
    reviewerGroups: targets
      .map(target => target.pounce.reviewers)
      .filter(reviewers => {
        return reviewers && reviewers.length > 1;
      })
  };
}

/**
 * Given the existing pr and raw config, calculate which targets match
 * @param {*} prowl
 */
async function calculatePRConfig(prowl, config) {
  const { robot, context, pr } = prowl;

  // Get files changed in this pr
  const { data: dirtyFiles } = await context.github.pullRequests.getFiles(
    context.repo({ number: pr.number, per_page: 100 })
  );
  const dirtyFilePaths = dirtyFiles.map(f => f.filename);

  // Filter targets from the config
  const targetsMatched = config.targets
    // by base
    .filter(target => {
      return pr.base.ref === target.stalk.base;
    })
    // by filepath
    .filter(target => {
      return utils.minimatchCartesian(dirtyFilePaths, target.stalk.paths, {
        dot: true
      });
    });
  context.log.info(
    `${pr.url}: matches targets ${JSON.stringify(
      targetsMatched.map(t => t.id)
    )}`
  );

  // Summarise targets succintly
  const prConfig = summariseTargets(targetsMatched);
  return prConfig;
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
      const prConfig = await calculatePRConfig(prowl, config);
      context.log.warn(prConfig);

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
