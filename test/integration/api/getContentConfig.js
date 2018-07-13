const defaultConfig = `
version: '0.1.0'
targets:
  - id: markdown
    stalk:
      paths:
        - "**/*.md"
      base: master
    pounce:
      auto_pounce: true
      check_delay: 0
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
      not_ready_labels:
        - WIP
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
