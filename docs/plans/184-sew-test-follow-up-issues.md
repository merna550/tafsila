# Plan — #184 Sew-test follow-up issues

Plan source: the issue body (`plan:none`).

- Rule in `docs/WORKFLOW.md` and `.claude/procedures/build.md`: `needs:sew-test` issues carry no toile criterion; the builder opens `test(engine): sew-test toiles for #N` and names it in the PR body as `Sew-test follow-up: #M`.
- Convert existing issues: #128, #129, #134, #135, #136 get follow-ups #198, #197, #199, #200, #201; the toile criterion is removed from each with a note; #148 lists them under "Depends on".
- Warning-level CI step `scripts/sew-test-followup.mjs` in `quality.yml`, tested with fixture PR bodies.

## Deviations

- Converted five issues (#128, #129, #134, #135, #136), all closed with `needs:sew-test`, as asked by the session.
- Their other unticked snapshot criteria (which shared a line with the toile) were left unticked: not verified here.
