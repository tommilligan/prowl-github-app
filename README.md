# prowl-github-app

> A GitHub App built with [Probot](https://github.com/probot/probot) that

## Thanks

Icon from [Creative Commons](https://openclipart.org/detail/183951/cats-eye).

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## Overview

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

### Configuration

Configuration is derived from the repo default branch (normally `master`).

See the `examples/` directory for template `prowl.yml` files.

### Checks

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
