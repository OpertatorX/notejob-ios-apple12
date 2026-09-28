# OX Invoice Git hotfix 1.0.6

Fixes the PowerShell 5.1 failure when probing a GitHub repository that does not exist yet.

Changes:
- repository existence probe no longer aborts on expected gh stderr;
- repository is created under the authenticated GitHub login;
- git push explicitly sets upstream with `git push -u origin <branch>`.
