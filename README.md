
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
[![Greenkeeper badge](https://badges.greenkeeper.io/tommilligan/prowl-github-app.svg)](https://greenkeeper.io/)
[![Known Vulnerabilities](https://snyk.io/test/github/tommilligan/prowl-github-app/badge.svg?targetFile=package.json)](https://snyk.io/test/github/tommilligan/prowl-github-app?targetFile=package.json)


Prowl is a stateless, declarative GitHub bot powered by [Probot](https://github.com/probot/probot). It listens for updates from your repositories, and merges pull requests only when your custom criteria are met. It works purely from the GitHub API, with no internal storage to manage. Power through your PR reviews, and let Prowl worry about merging to master.

# prowl-github-app

## Use

Once installed (see below), prowl will run in the background. You should not need to talk to it directly.

### Commands

If you want to check on what prowl is thinking, you can summon it in a PR with a command.
Commands are comments with **exactly**:
- `prowl status`: quickly get the status of the PR right now
- `prowl touch`: trigger a full recheck. Should happen automatically

> Press `Ctrl+Enter` to immediately submit a prowl command

Debugging:
- `prowl config`: show the internal configuration for this PR
- `prowl debug`: show the status of all conditions on this PR
- `prowl id`: show the GitHub app id of this bot
- `prowl version`: show the running version of prowl

### Statuses

If using prowl to set statuses, they have the following meaning:
- `success`: PR passed all criteria for merge. See use as a [required status check](https://help.github.com/articles/about-required-status-checks/) 
- `failure`: PR did not pass one or more criteria.
- `pending`: prowl is aware of a recent change, and is
  - waiting for the max time specified in `pounce.check_delay`
  - talking to the GitHub API

### Configuration

Prowl looks for `.prowl.yml` in your repo's default branch (usually `master`). No action will be taken unless a valid configuration is found.

Prowl can watch multiple PR `targets` . A PR matching `stalk` will be reviwed on each update - when `pounce` if fulfilled, the PR will be merged.

If multiple targets are stalked in a single PR, prowl will combine configurations together using the accumulators mentioned below. 
Currently how multiple branches are combined is not configurable.

```yaml

# Config version
version: '0.1.0'

targets:

  # Unique id for this target
  - id: my-code-source

    # What prowl watches
    stalk:
      # PR changed files. Triggers if any path matches any file
      # prowl uses the minimatch library internally, see below for details
      paths:
        - "src/**/*"
      # exceptions to the above paths. Suppresses triggering on these files
      # default: [] (no exceptions)
      paths_ignore:
        - "src/notes/**/*"
      # PR base branch
      base: master

    # When prowl merges
    pounce:
      # PR reviewers. Only one approval from the list is required
      # default: [] (no reviews required)
      # this list can be nested (see examples/teams.yml)
      reviewers:
        - tommilligan
        - octocat  
      # number of reviewers from the group whose approval is required
      # default: 1
      reviewer_count: 2

      # action (currently merge|status)
      # if set to 'status', set this as a required status check on your protected branch
      # https://help.github.com/articles/about-required-status-checks/
      # default: merge
      # accumulator: error if more than one unique value
      action: status
      # Automatically merge the PR when all checks have passed, without a merge command
      # default: false
      # accumulator: every
      auto_pounce: true
      # Treat the author of the PR as an approving review
      # default: false
      # accumulator: every
      author_implicit_reviewer: true
      # Delay PR checks to allow CI to start (seconds)
      # default: 5
      # accumulator: max
      check_delay: 90
      # Adjust commit message automatically
      # default: null (title of PR)
      # accumulator: error if more than one unique value
      commit_message_parser: clubhouse
      # Append the PR number to the commit message in the format ` (#\d+)`
      # default: false
      # accumulator: every
      commit_message_pr_number: true
      # whether to delete PR branches following a merge
      # default: true
      # accumulator: every
      delete: false
      # Write comments instead of other actions
      # default: false
      # accumulator: some
      dry_run: true
      # PR with any of these lables will immediately fail a merge check
      # default: none
      # accumulator: concat
      not_ready_labels:
        - WIP
        - nomerge
      # merge_method (currently merge|squash|rebase) as described here:
      # https://developer.github.com/v3/pulls/#merge-a-pull-request-merge-button
      # default: squash
      # accumulator: error if more than one unique value
      merge_method: merge

```

### File glob/pattern matching

Prowl uses the [minimatch](https://github.com/isaacs/minimatch) library to handle glob-like matching.
Please [see here](https://github.com/isaacs/minimatch) for a reference of valid patterns. Prowl uses the options `{dot: true}`.

For example:
- `**/*` matches all files
- `{foo,bar}/*` matches all immediate children of the `foo` and `bar` directories
- `!{ignoreme}/**/*` matches all files not in the `ignoreme` directory

### Ignoring PRs

Prowl will respectfully ignore PRs you have tagged as not ready.
Make sure you configure `pounce.not_ready_labels` with a list of labels to treat as an immediate fail.


### Multi-target PRs

PRs matching more than one `target` will only be merged when **all targets are passed**.

This [more realistic configuration](examples/full-stack.yml) has two sets of files, `frontend` and `backend`, which can only be merged by the appropriate teams.
`docs` can be edited by anyone, and `config` has to have joint approval from the two team leads.

See the [examples](examples) directory for more `prowl.yml` ideas.

## Installation

Please see the [changelog](CHANGELOG.md) when upgrading.

### Public instance

Details to be confirmed!

### Private instance

#### Source

Docker images from `master` are automatically uploaded to [Docker Hub](https://hub.docker.com/r/tommilligan/prowl-github-app).

#### Host

Your instance of prowl needs to be accessible at a public URL such as:
- `https://prowl.your-domain.com/`
- `https://your-domain.com/prowl`

You will need to set environment variables as described in `.env.example`. In production, you'll also want:
- `LOG_FORMAT=json` for structured log draining
- `PRIVATE_KEY=$(cat <your/private-key.pem>)`, [see here](https://probot.github.io/docs/deployment/#deploy-the-app). In development, just add a `*.pem` file to your working directory.
- `INSTALLATION_TOKEN_TTL=3300`, this reduces the cache time of probot's auth tokens. This value should be 3600 (one hour) minus your longest possible check time (see `pounce.check_delay`).

#### GitHub Register

You'll need to set up a private GitHub app to point to this instance, with the following details:
- Name: `prowl-<your-custom-name>`
- Webhook URL: the URL of the running app
- Permissions:

| Permission             | Access               | Purpose                                 |
| ---------------------- | -------------------- | --------------------------------------- |
| Repository contents    | read & write         | read configuration, merge PRs           |
| Issues                 | read                 | read prowl commands                     |
| Repository metadata    | read                 | required for all apps                   |
| Pull requests          | read & write         | PR commit info, reviews, comments       |
| Commit statuses        | read & write         | commit CI status                        |

- Events:

| Event                  | Purpose                                 |
| ---------------------- | --------------------------------------- |
| Issue comment          | respond to prowl commands               |
| Pull request           | check PRs when opened or updated        |
| Pull request review    | check PRs after a successful review     |
| Status                 | check PRs after CI passes               |

#### GitHub Install

Install this app on a repo for prowl to start recieving webhooks for it.

No action will be taken until a valid `.prowl.yml` is found in the repository.


## Development

```sh
yarn install
yarn dev
# and localtunnel to your machine
```

### Deployment

Prowl is currently deployed to a Heroku free tier web dyno from `master`

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

