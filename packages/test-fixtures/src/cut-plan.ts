/** A small hand-written direct-cut plan for component tests (issue #291): one piece on the fold, one without, three kinds of step. Plain JSON in the shape of the web app's `CutPlan`. */

/** Two pieces: "Front" cut once on the fold (3 steps, a curve, 3 points) and "Sleeve" cut twice (2 steps). */
export const cutPlanFixture = {
  engineVersion: "1.4.0",
  curveStepMm: 25,
  pieces: [
    {
      pieceId: "front-panel",
      name: { ar: "الأمام", en: "Front" },
      cutCount: 1,
      onFold: true,
      reference: {
        text: { ar: "الخط المرجعي هو الطيّة.", en: "The fold is the reference line." },
        lines: [
          { id: "reference", kind: "fold", from: { x: 0, y: 0 }, to: { x: 0, y: 300 } },
          { id: "top", kind: "top", from: { x: 0, y: 0 }, to: { x: 200, y: 0 } },
        ],
      },
      points: [
        { id: "A", label: "A", at: { x: 185, y: 0 } },
        { id: "B", label: "B", at: { x: 185, y: 62 } },
        { id: "C", label: "C", at: { x: 120, y: 300 } },
      ],
      steps: [
        {
          id: "front-panel#4",
          no: 1,
          text: {
            ar: "انزلي 0.0 سم من الخط العلوي و 18.5 سم من الخط المرجعي، وضعي النقطة A.",
            en: "Measure 0.0 cm down from the top line and 18.5 cm from the reference line. Mark point A.",
          },
          pointIds: ["A"],
          guides: [{ from: { x: 0, y: 0 }, to: { x: 185, y: 0 }, mm: 185 }],
          group: "corners",
        },
        {
          id: "front-panel#5",
          no: 2,
          text: {
            ar: "على المنحنى: انزلي 6.2 سم من الخط العلوي و 18.5 سم من الخط المرجعي، وضعي النقطة B.",
            en: "On the curve: measure 6.2 cm down and 18.5 cm from the reference line. Mark point B.",
          },
          pointIds: ["B"],
          guides: [
            { from: { x: 0, y: 62 }, to: { x: 185, y: 62 }, mm: 185 },
            { from: { x: 185, y: 0 }, to: { x: 185, y: 62 }, mm: 62 },
          ],
          group: "curves",
        },
        {
          id: "front-panel#6",
          no: 3,
          text: {
            ar: "صلي النقطة A بالنقطة C بخط مستقيم.",
            en: "Join point A to point C with a straight line.",
          },
          pointIds: ["A", "C"],
          guides: [],
          group: "corners",
        },
      ],
      diagram: { widthMm: 200, heightMm: 300, outlineD: "M 0 0 L 200 0 L 200 300 L 0 300 Z" },
    },
    {
      pieceId: "sleeve",
      name: { ar: "كم", en: "Sleeve" },
      cutCount: 2,
      onFold: false,
      reference: {
        text: {
          ar: "ارسمي خطاً مرجعياً موازياً لحافة القماش.",
          en: "Draw a reference line parallel to the selvedge.",
        },
        lines: [
          { id: "reference", kind: "grain", from: { x: 0, y: 0 }, to: { x: 0, y: 250 } },
          { id: "top", kind: "top", from: { x: 0, y: 0 }, to: { x: 250, y: 0 } },
        ],
      },
      points: [{ id: "A", label: "A", at: { x: 10, y: 0 } }],
      steps: [
        {
          id: "sleeve#4",
          no: 1,
          text: {
            ar: "انزلي 0.0 سم من الخط العلوي و 1.0 سم من الخط المرجعي، وضعي النقطة A.",
            en: "Measure 0.0 cm down from the top line and 1.0 cm from the reference line. Mark point A.",
          },
          pointIds: ["A"],
          guides: [{ from: { x: 0, y: 0 }, to: { x: 10, y: 0 }, mm: 10 }],
          group: "corners",
        },
        {
          id: "sleeve#5",
          no: 2,
          text: { ar: "على الخط المرسوم: قص 2.", en: "Cut 2, along the drawn line." },
          pointIds: [],
          guides: [],
          group: "corners",
        },
      ],
      diagram: { widthMm: 250, heightMm: 250, outlineD: "M 0 0 L 250 0 L 250 250 L 0 250 Z" },
    },
  ],
} as const;
