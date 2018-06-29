
<p align="center">
  <img src="static/cats-eye.png" alt="prowl-icon" height="150" width="155">
  <h1 align="center">prowl</h1>
</p>
<p align="center" style="font-size: 1.2rem;">stalks your pull requests, so you don't have to</p>

[![license](https://img.shields.io/github/license/tommilligan/prowl-github-app.svg)]()
[![Travis branch](https://img.shields.io/travis/tommilligan/prowl-github-app/master.svg)](https://travis-ci.org/tommilligan/prowl-github-app)
[![codecov](https://codecov.io/gh/tommilligan/prowl-github-app/branch/master/graph/badge.svg)](https://codecov.io/gh/tommilligan/prowl-github-app)
[![David](https://img.shields.io/david/tommilligan/prowl-github-app.svg)](https://david-dm.org/tommilligan/prowl-github-app)
[![Docker Pulls](https://img.shields.io/docker/pulls/tommilligan/prowl-github-app.svg)](https://hub.docker.com/r/tommilligan/prowl-github-app/)


Prowl is a stateless, declarative GitHub bot powered by [Probot](https://github.com/probot/probot). It listens for updates from your repositories, and merges pull requests only when your custom criteria are met. It works purely from the GitHub API, with no internal storage to manage. Power through your PR reviews, and let Prowl worry about merging to master.

# prowl-github-app

## Use

Once installed (see below), prowl will run in the background with no input from you.

If you want to check on what it's thinking, you can summon it in a PR by commenting **exactly**:
- `prowl config`: show the calculated configuration for this PR
- `prowl status`: show prowl's evaluation of this PR

> Press `Ctrl+Enter` to immediately submit a prowl command

### Configuration

Prowl looks for `.prowl.yml` in your repo's default branch (usually `master`). No action will be taken unless a valid configuration is found.

Prowl can watch multiple PR `targets` . A PR matching `stalk` will be reviwed on each update - when `pounce` if fulfilled, the PR will be merged.

```yaml

# Config version
version: '0.1.0'

targets:

  # Unique id for this target
  - id: my-code-source

    # What prowl watches
    stalk:
      # PR changed files. Triggers if any path matches any file
      paths:
        - "src/**/*"
      # PR base branch
      base: master

    # When prowl merges
    pounce:
      # PR reviewers. Only one approval required
      reviewers:
        - tommilligan
        - octocat  

    # Write comments instead of other actions
    dry_run: true

    # Delay PR checks to allow CI to start (seconds)
    check_delay: 90
```

### Merge strategy

Currently, `prowl` only supports merging by the `squash` strategy. If you'd like other options, please open an issue!

### Multi-target PRs

PRs matching more than one `target` will only be merged when **all targets are passed**.

This [more realistic configuration](examples/full-stack.yml) has two sets of files, `frontend` and `backend`, which can only be merged by the appropriate teams.
`docs` can be edited by anyone, and `config` has to have joint approval from the two team leads.

See the [examples](examples) directory for more `prowl.yml` ideas.

## Installation

### Public instance

Details to be confirmed!

### Private instance

Docker images from `master` are automatically uploaded to [Docker Hub](https://hub.docker.com/r/tommilligan/prowl-github-app).
These can be run in any compatible environment (for ease Heroku, for reliability AWS).
You will need to set environment variables as described in `.env.example`.

You'll need to set up a private GitHub app to point to this instance, with the following details:
- Webhook URL: the root URL of the running image (`https://your.domain.here/`)
- Permissions:

| Permission             | Access               | Purpose                                 |
| ---------------------- | -------------------- | --------------------------------------- |
| Repository contents    | read & write         | read configuration, merge PRs           |
| Issues                 | read & write         | read PR commands, write PR comments     |
| Repository metadata    | read                 |                                         |
| Pull requests          | read                 | read PR commit info, reviews            |
| Commit statuses        | read                 | read commit CI status                   |

- Events:

| Event                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| Issue comment          | respond to PR commands                  |
| Pull request           | check PRs when opened or updated        |
| Pull request review    | check PRs after a successful review     |
| Status                 | check PRs after CI passes               |

Install this app on the repos you want to watch, and you should be good to go!


## Development

```sh
yarn install
yarn dev
# and localtunnel to your machine
```

### Design

```
prowl
-----

event listeners  <---------+
  +                        |
  v                        +
stateless checks +------> GitHub API
  +                        ^
  v                        |
actions          +---------+
```

On each event, a preliminary check is run to see if it looks interesting.

If the event _could_ trigger a merge, all checks are run through in full. Each layer is more involved:
- index - listen for webhooks
- events - filter out interesting events
- middleware - load and calculate config
- logic - work out which actions to apply
- actions - act (unless `dry_run` is set)

```
commit status     PR review
           +       +
           +---+---+
               v
       relevant?
         - success
         - head of an open PR
               +
               v
          PR details
          Load config
               +
               v
       ready to merge?
         - no new commits recently
         - all checks complete
         - required reviews
         - no merge conflicts
               +
               v
             merge
         delete branch
```
## Thanks

Icon from [Creative Commons](https://openclipart.org/detail/183951/cats-eye).

