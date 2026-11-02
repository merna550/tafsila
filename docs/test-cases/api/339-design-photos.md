# Test cases — design photos, ai_usage, unsupported_features

| Field        | Value                                            |
| ------------ | ------------------------------------------------ |
| Issue        | #339                                             |
| SRS          | FR-DES-01, FR-DES-07, NFR-04, NFR-05, SRS §7, §8 |
| Area         | api                                              |
| Last updated | 2026-11-02 (by PR for #339)                      |

## Test data

A staging or local account with one design. Get a token as in [use Postman](../../backend/tutorials/use-postman.md). Tutorial: [design photos](../../backend/tutorials/design-photos.md).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                 | Priority | Preconditions                     | Steps                                                                                                          | Expected result                                                        | Automated by                                      | dev | staging |
| ------------- | ------------------------------------- | -------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- | --- | ------- |
| TC-API-339-01 | Upload the front photo with curl      | High     | A design id                       | `POST /api/designs/{id}/photos` with one `front` jpeg, then `curl -X PUT --data-binary @photo.jpg <signedUrl>` | 200 with `signedUrl`; the PUT succeeds; `GET .../photos` lists `front` | `design-photos.test.ts`, `design-photos.test.sql` | ⬜  | ⬜      |
| TC-API-339-02 | Read URL expires after 5 minutes      | Medium   | Photo uploaded                    | Open the `url` from `GET .../photos`; wait 6 minutes; open it again                                            | First opens the image; second is refused                               | manual only                                       | ⬜  | ⬜      |
| TC-API-339-03 | Another user's photo is unreachable   | High     | Two accounts                      | As B call `GET`, `POST` and `DELETE` on A's design photos                                                      | 404 each time; B cannot read the object path directly                  | `design-photos.test.ts`, `design-photos.test.sql` | ⬜  | ⬜      |
| TC-API-339-04 | Deleting a design removes its objects | High     | Photo uploaded                    | `DELETE /api/designs/{id}`; check the bucket                                                                   | No objects under `<userId>/<designId>/`                                | `design-photos.test.ts`                           | ⬜  | ⬜      |
| TC-API-339-05 | Deleting the account removes objects  | High     | Photo uploaded, throwaway account | `DELETE /api/account`; check the bucket                                                                        | No objects under `<userId>/`                                           | `design-photos.test.ts`                           | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
