const minimatch = require("minimatch");

function minimatchCartesian(files, globs, opts) {
  // at least one file
  return files.some(function(file) {
    // matches at least one glob
    return globs.some(function(glob) {
      return minimatch(file, glob, opts);
    });
  });
}

module.exports = {
  minimatchCartesian
};
