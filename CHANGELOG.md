# Changelog

## 1.6.1

### Enhancements

- update to `probot` version `9.0.0`
- dependency updates

## 1.6.0

### Bugfixes

- updated permissions to reflect new and existing GitHub scopes
  - upgraded commit statuses to `read & write`
  - upgraded pull requests to `read & write`
  - downgraded issues to `read`
- updated underlying `probot` version to `7.1.0`

## 1.5.0

### Features

- add the `ignore_paths` key to allow partial ignoring of complex targets

## 1.4.0

### Features

- support teams by flattening nested reviewers automatically

## 1.3.4

### Bugfixes

- respect the env var `INSTALLATION_TOKEN_TTL` to remove occasional `401 Unauthorized` errors on long running tasks

## 1.3.3

### Bugfixes

- ignore PR reviews with status COMMENTED or DISMISSED, rather that treating them as a fail

## 1.3.2

### Enhancements

- improve wording and formatting of `prowl status`

## 1.3.1

### Enhancements

- periodically dump GitHub rate-limiting telemetry to logs

### Bugfixes

- only check most recent PR review for each user

## 1.3.0

### Features

- clubhouse title smart reformatting
  - reformats GitHub's auto formatted branch name
  - pulls ticket numbers from title or branch name
- prettified output of `prowl status` command
- added optional `reviewer_count` with default value of `1`

### Enhancements

- links to readme from the `Details` link in a prowl commit status

### Bugfixes

- perform a check on all events to ensure `failure` statuses are always calculated
- fail if there are outstanding reviews with no response

## 1.2.1

### Bugfixes

- version bump missed

## 1.2.0

### Features

- respect PRs labelled with `WIP` like tags
- when checking status, use all three states instead of just success
- renamed commands to make better sense
  - status => debug
  - merge => status
  - merge => **deprecated for future reuse**
  - touch (new: trigger a complete recheck)

### Enhancements

- far more integration tests

### Bugfixes

- prowl will ignore it's own actions where applicable to prevent deadlocks/loops

## 1.1.3

### Features

- prowl can simply show status on PR instead of merging
  - links in to GitHubs _required status checks_ feature

## 1.1.2

### Bugfixes

- fixed custom logging middleware in `-cr` image series

## 1.1.1

### Features

- added custom logging middleware in `-cr` image series

## 1.1.0

### Features

- made default behaviour not auto merge

## 1.0.0

### Features

- added option for implicit author approval
- deploy Docker images to DockerHub

### Enhancements

- updated to probot@7
- better logging metadata for each PR

### Bugfixes

- stop merging PRs which match 0 targets
- fixed sometimes logging `[object Object]`
- fixed flaky Heroku cli install

## 0.0.2

### Enhancements

- added integration testing
- added documentation

### Bugfixes

- fixed async/await throughout

## 0.0.l

### Features

- working prototype
- listens for and dispatches events resulting in PR merges.
