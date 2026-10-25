/** Public API of the export package: the print tile layout for A4 and A0 (decision 283). */
export { tileInput } from "./tiles/tile-input";
export { tileSheet } from "./tiles/tile-sheet";
export { pageMap } from "./tiles/page-map";
export { columnLetter } from "./tiles/labels";
export { PAPERS, type Orientation, type Paper, type PaperId } from "./tiles/paper";
export type { AlignMark, PageMap, Tile, TileInput, TileSide, Tiling } from "./tiles/types";
