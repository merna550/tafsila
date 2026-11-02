# ADR-345 · 2026-11-02 · Version compare is a client-side overlay

## Context

FR-CHAT-05 asks to compare two versions of a pattern (the part left after #252). ADR-335 item 7 says compare is a browser overlay with no new API, and ADR-252 gives the version view it builds on.

## Decision

1. Compare is a client-side overlay: both versions are read with the existing `GET /api/versions/:id` and drafted again in the preview worker from their stored inputs. No new API.
2. Pieces are matched by id and drawn at their own origin: each piece of the second version is moved onto the corner of the same piece in the first, so a change shows in place instead of where the sheet packing put it.
3. The differences are listed per design feature, measurement and ease profile, in the words of the design picker. There is no numeric geometry diff (out of scope).
4. The route is `/designs/[id]/versions/compare?a=<versionId>&b=<versionId>`. The history ticks two versions (a third tick replaces the oldest) and links with the older version first. The screen keeps the order of the URL, and a swap button flips it.
5. Follows the design (`Compare.dc.html`): the first version is a solid primary line, the second a dashed accent line, a piece only in the first is red and a piece only in the second is green. The legend checkboxes show and hide a version.

## Reason

No server work, so no new endpoint, permission or storage; the preview worker is already fast (NFR-02).

## Alternatives

A server-side diff endpoint: more surface to secure and test for no gain. A shared sheet layout for both drafts: a change in size would also move the neighbours and hide the change.
