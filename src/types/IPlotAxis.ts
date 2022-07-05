/** Represents a particular axis on a plot. */
interface IPlotAxis {
  /** The label for the axis. */
  label?: string;
  /** Whether grid lines should be displayed on the direction of the axis. */
  showLines?: boolean;

  /** The minimum value of the axis. If not specified, defaults to the minimum extent of the data. */
  minimum?: number;
  /** The maximum value of the axis. If not specified, defaults to the maximum extent of the data. */
  maximum?: number;
}

export type { IPlotAxis };
