const minimatch = require('minimatch')

function minimatchCartesian (files, globs, globsIgnore, opts) {
  // at least one file
  return files.some(function (file) {
    // Run a glob against this preset file + opts
    function fileGlob (glob) {
      return minimatch(file, glob, opts)
    }

    // matches at least one glob
    const match = globs.some(fileGlob)
    // and none of the ignore globs
    const notIgnore = !globsIgnore.some(fileGlob)
    return match && notIgnore
  })
}

module.exports = {
  minimatchCartesian
}
