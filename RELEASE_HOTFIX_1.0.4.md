# OX Invoice release hotfix 1.0.4

Fixes a Windows PowerShell 5.1 argument-splatting bug in `scripts/RELEASE.ps1`.

`Run-Checked` used a parameter named `$Args`, which collides with PowerShell's automatic `$args` variable.
As a result, `node` could be launched with zero arguments and drop into the interactive Node.js REPL (`>` prompt).

The parameter is now named `$Arguments` and is splatted with `@Arguments`.

After applying the patch, rerun `GO_LIVE.ps1`. Existing release state is preserved.
