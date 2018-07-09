const defaultConfig = `
_test_defaults: &test-defaults
  auto_pounce: true
  check_delay: 0

targets:

  # Each type of PR has a seperate specification
  - id: catchall
    stalk:
      paths:
        - "**/*"
      base: master
    pounce:
      <<: *test-defaults
      reviewers: []

  - id: markdown
    stalk:
      paths:
        - "**/*.md"
      base: master
    pounce:
      <<: *test-defaults
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
`

function encodeToContent (c) {
  return Buffer.from(c).toString('base64')
}

module.exports = function (config = defaultConfig) {
  return {
    data: {
      name: '.prowl.yml',
      path: '.prowl.yml',
      sha: '173f87334fc64a4d054dfd76d40f51cad6e3f7e9',
      size: 536,
      url:
        'https://api.github.com/repos/tommilligan/prowl-target-stage/contents/.prowl.yml?ref=master',
      type: 'file',
      content: encodeToContent(config),
      encoding: 'base64'
    }
  }
}
