/** Represents a particular style on a plot. */
interface IPlotStyle {
  /** The color of a filled element. */
  fillColor?: string;
  /** The radius of a filled element. */
  fillRadius?: number;

  /** The color of a stroked element. */
  strokeColor?: string;
  /** The width of a stroked element. */
  strokeWidth?: number;
}

export type { IPlotStyle };
