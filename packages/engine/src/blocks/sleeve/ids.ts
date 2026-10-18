/** Ids shared by the sleeve piece and the bodice armhole notches it pairs with (issue #134). */

/** Id of the sleeve piece. */
export const SLEEVE_PIECE_ID = "sleeve";

/** Edge ids of the sleeve, in path order from the back underarm. */
export const SLEEVE_EDGE = {
  capBack: "cap-back",
  capFront: "cap-front",
  underarmFront: "underarm-front",
  hem: "hem",
  underarmBack: "underarm-back",
} as const;

/** Notch ids, the same on the sleeve and on the bodice armhole they match. */
export const SLEEVE_NOTCH = {
  back1: "armhole-back-1",
  back2: "armhole-back-2",
  front: "armhole-front",
  shoulder: "shoulder",
} as const;

/** Id of the armhole edge on both bodice pieces. */
export const BODICE_ARMHOLE_EDGE = "armhole";
