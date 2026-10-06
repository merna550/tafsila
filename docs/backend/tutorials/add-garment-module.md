# Add a garment feature to the engine

1. Plan with `plan:opus`: drafting method (with source), parameters, which DesignSpec enum it extends, validation rules it must satisfy.
2. Extend the DesignSpec schema + catalogue (with option card image and Arabic name).
3. Implement as a pure part in `packages/engine` (mm units, no randomness), reusing blocks.
4. Tests: unit for key points; property tests across the size matrix for every FR-VAL check; SVG snapshot per size.
5. Label placement, grain line and notches follow the engine layout rules (no overlaps; snapshot test enforces).
6. Add the design to seed data and test cases; keep `needs:sew-test` until a toile is sewn in 3 sizes and the result is logged in the test case file.
