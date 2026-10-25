/** Tile labels: a column letter and a row number, `A1` at the top-left (physical, same in both locales). */

/** Letters in the alphabet. */
const LETTERS = 26;
/** Char code of `A`. */
const CODE_A = 65;

/**
 * Spreadsheet-style column letter: 0 is A, 25 is Z, 26 is AA.
 *
 * @param index - Column from 0.
 * @returns The letters.
 */
export function columnLetter(index: number): string {
  let rest = index;
  let out = "";
  do {
    out = String.fromCharCode(CODE_A + (rest % LETTERS)) + out;
    rest = Math.floor(rest / LETTERS) - 1;
  } while (rest >= 0);
  return out;
}

/**
 * Label of the tile at a column and row.
 *
 * @param col - Column from 0.
 * @param row - Row from 0.
 * @returns For example `B3`.
 */
export function tileLabel(col: number, row: number): string {
  return `${columnLetter(col)}${row + 1}`;
}
