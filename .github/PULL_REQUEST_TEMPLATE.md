__Pull request template__


1 __A reference to the corresponding issue__ or issues that will be closed by the pull request. Please refer to these issues using the following syntax:

```markdown
(For a single issue)
Fixes #20

(For multiple issues)
Fixes #32, #40
```

Github automatically close the issues after merging it to the master. So please, keep the format.

2 __A succinct description of the design__ used to fix any related issues. For example:

 ```markdown
 This fixes #20 by removing styles that leaked which would cause the page to turn pink whenever `paper-foo` is clicked.
 ```


3 __At least one test for each bug fixed or feature added__ as part of the pull request. Pull requests that fix bugs or add features without accompanying tests will not be considered.

If a proposed change contains multiple commits, please [squash commits](http://blog.steveklabnik.com/posts/2012-11-08-how-to-squash-commits-in-a-github-pull-request) to as few as is necessary to succinctly express the change.
