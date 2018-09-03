module.exports = function (config) {
  config.set({
    testRunner: 'jest',
    mutator: 'javascript',
    transpilers: [],
    reporters: ['html', 'baseline', 'clear-text', 'progress'],
    packageManager: 'yarn',
    coverageAnalysis: 'off',
    mutate: ['src/**/*.js']
  })
}
