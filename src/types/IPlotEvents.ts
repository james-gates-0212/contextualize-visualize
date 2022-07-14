
/** The events that may be emitted from a plot. */
interface IPlotEvents<TDatum> {
  /** An event listener that is called when a point is called exactly once (does not fire on double click). */
  singleClickPoint: (point: TDatum) => void;
  /** An event listener that is called when a point is clicked exactly twice (does not fire on single click). */
  doubleClickPoint: (point: TDatum) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

export type {
  IPlotEvents,
};
