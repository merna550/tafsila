# ADR-320 · 2026-10-28 · Admin fabric catalogue and rules editor

**Context:** FR-REC-03 and FR-ADM-02: Merna changes the fabric catalogue and the recommendation rules from the app, without a deploy. The admin API (#317) and `@tafsila/fabric-kb` (#314) exist; the screens are `AdminFabrics.dc.html` and `AdminFabricEdit.dc.html`.

**Decision:**

1. **The preview runs `recommend` in the browser on the unsaved rows.** `@tafsila/fabric-kb` is pure and small, so the dialog applies the edited rule over the loaded rules and shows the result before and after, with no new endpoint and no worker.
2. **Preview designs are bundled fixtures, not the admin's own designs.** Admins never see user data ([ADR-32a](32a-mini-admin-api.md) item 4). The fixtures come from `@tafsila/test-fixtures` and are imported only by the admin preview module.
3. **`stretch` is not editable in v1.** Every fabric in the catalogue is woven, so the form sends 0 and says so in a note.
4. **Delete is a hard delete after a confirmation.** The audit row written by the API keeps the old value.
5. **Levels are stored 0 to 4 and shown 1 to 5**, as in the design; the picker is a row of five buttons.
6. **A rule condition is picked, never typed.** The path comes from `RULE_PATHS`, the operator from the path's kind, the values from its allowed list; changing the path resets the operator and the values. Labels reuse `designPicker.paths` and `designPicker.options`.
7. **Layout follows the design:** one list page per section (`/admin/fabrics`, `/admin/fabric-rules`) joined by a tab strip, a page for the fabric form, a dialog for the rule form.
8. **Every save invalidates the admin list and the cached recommendations** (`fabricKeys.all`), so a renamed fabric shows on the next visit to a saved version.

All are cheap to reverse (no production data, ADR-026 in [DECISIONS.md](../DECISIONS.md)).
