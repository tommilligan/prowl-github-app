# Changelog

## next

- smart fast fail on some events

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
  - links in to GitHubs *required status checks* feature

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