# prowl-github-app

[![license](https://img.shields.io/github/license/tommilligan/prowl-github-app.svg)]()

[![Travis branch](https://img.shields.io/travis/tommilligan/prowl-github-app/master.svg)](https://travis-ci.org/tommilligan/prowl-github-app)
[![codecov](https://codecov.io/gh/tommilligan/prowl-github-app/branch/master/graph/badge.svg)](https://codecov.io/gh/tommilligan/prowl-github-app)
[![David](https://img.shields.io/david/tommilligan/prowl-github-app.svg)](https://david-dm.org/tommilligan/prowl-github-app)

Prowl watches your Pull Requests, and merges them whenever they're ready.

> built with [Probot](https://github.com/probot/probot)

## Use

Prowl looks for `.prowl.yml` in your repo's default branch (usually `master`). No action will be taken unless a valid configuration is found.

### Configuration

**prowl** has PR `targets` it watches for. A PR matching `stalk` will be reviwed on each update - when `pounce` if fulfilled, the PR will be merged.

```yaml

# Config version
version: '0.1.0'

targets:

  # Unique id for this target
  - id: frontend

    # What prowl watches
    stalk:
      # PR changed files. Triggers if any path matches any file
      paths:
        - "ui/**/*"
      # PR base branch
      base: master

    # When prowl merges
    pounce:
      # PR reviewers. Only one approval required
      reviewers:
        - frontend-lead-user
        - frontend-dev-1
        - frontend-dev-2

    # Write comments instead of other actions
    dry_run: true

    # Delay PR checks to allow CI to start (seconds)
    check_delay: 90
```

#### Multi-target PRs

PRs matching more than one `target` will only be merged when **all targets are passed**.
This means at least **one reviewer from each target must approve the PR**.

Say your repo has two sets of files, `frontend` and `backend`, which can only be edited by the appropriate teams. `docs` can be edited by anyone, and `config` has to have joint approval from the two team leads.

A configuration for Prowl might look [like this](examples/full-stack.yaml).

See the [examples](examples) directory for more valid `prowl.yml` files.

### Installation

#### Public instance

Details to be confirmed!

#### Private instance

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

**prowl** is a stateless node.js webapp.

Bootstrapped from [probot](https://github.com/probot/probot), it listens for events from GitHub's events API and responds with actions. It has no internal state (DB, in-memory cache, container fs, etc.), which makes it easy to reason about.

All inputs are driven by the target repo.


### Workflow

On each event, a preliminary check is run to see if it looks interesting.

If the event _could_ trigger a merge, all checks are run through in full.

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

