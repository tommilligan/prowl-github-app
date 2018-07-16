# Changelog

## next

### Features
- clubhouse title smart reformatting


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