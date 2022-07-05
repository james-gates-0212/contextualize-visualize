import { IPlotAxis } from "./IPlotAxis";

/** Represents the base information contained in a graph layout. */
interface IPlotLayout<TType extends string> {
  /** The type of the plot. Used for automatically determining the plotter to use. */
  type?: TType;

  /** The optional size to assign to the generated plot.  */
  size?: {
    width: number;
    height: number;
  };
  /** The margins inside the plot rectangle between the edges and the plot. */
  margin?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };

  /** The optional styles to apply to the generated plot. */
  style?: Partial<CSSStyleDeclaration>;

  /** Information for all of the axes on a plot. */
  axes?: {
    x?: IPlotAxis;
    y?: IPlotAxis;
    z?: IPlotAxis;
  };
}

export type { IPlotLayout };
