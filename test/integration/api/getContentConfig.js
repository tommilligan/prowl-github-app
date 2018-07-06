const config = `
targets:

  # Each type of PR has a seperate specification
  - id: catchall
    # Just comment on the PR instead of merging
    dry_run: false
    # PRs we are interested in
    stalk:
      paths:
        - "**/*"
      base: master
    # Conditions to be met
    pounce:
      reviewers: []

  - id: markdown
    stalk:
      paths:
        - "**/*.md"
      base: master
    pounce:
      reviewers:
        - tommilligan
        - tommilligan-plutoflume
`
const content = Buffer.from(config).toString('base64')

module.exports = {
  'data': {
    'name': '.prowl.yml',
    'path': '.prowl.yml',
    'sha': '173f87334fc64a4d054dfd76d40f51cad6e3f7e9',
    'size': 536,
    'url':
      'https://api.github.com/repos/tommilligan/prowl-target-stage/contents/.prowl.yml?ref=master',
    'type': 'file',
    'content': content,
    'encoding': 'base64'
  }
}
