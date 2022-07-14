import * as d3 from "d3";
import { IPlotEvents, IPlotLayout, IPlotStyle, PlotWithAxis, Selection } from "types";
import { createSvg } from "utility";

/** The type of datum for each histogram plot point. */
interface IHistogramBin {
  /** The relative frequency of the histogram bin. */
  frequency: number;

  /** The minimum value of the bin. */
  min: number;
  /** The maximum value of the bin. */
  max: number;

  /** The optional styles to apply to the bin. */
  style?: IPlotStyle;
}

/** Represents the data contained in the plot. */
interface IHistogramPlotData<TDatum extends IHistogramBin = IHistogramBin> {
  /** The data to plot. */
  data: TDatum[];
  /** The colormap to use for mapping values to colors. */
  colormap?: string;
}

/** Represents the layout information for the plot. */
interface IHistogramPlotLayout extends IPlotLayout<"histogram"> {
  orientation: "horizontal" | "vertical";
}

/** The events that may be emitted from a histogram plot. */
interface IHistogramPlotEvents extends IPlotEvents<IHistogramBin> {}

/**
 * An object that persists, renders, and handles information about a histogram plot in 2D.
 */
class HistogramPlot extends PlotWithAxis<IHistogramPlotData, IHistogramPlotLayout, IHistogramPlotEvents> {
  // #region DOM
  private rectsSel?: Selection<SVGGElement, IHistogramBin, SVGGElement>;
  // #endregion

  /**
   * Constructs a new histogram plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: IHistogramPlotData,
    layout?: IHistogramPlotLayout,
    container?: HTMLElement,
  ) {
    super(data, layout, container);

    // Set the data.
    this._data = data ?? { data: [] };
    this._layout = layout ?? {
      orientation: "horizontal",
    };
    this._container = container;

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
  }

  private isHorizontal() {
    return this.layout.orientation === "horizontal";
  }

  private isVertical() {
    return this.layout.orientation === "vertical";
  }

  /** Initializes the scales used to transform data for the histogram plot. */
  private setupScales() {
    // Get the metrics for the SVG element.
    const { size, margin } = createSvg(undefined, this.layout);

    // Compute values.
    const rangePoints: number[] = [];
    this.data.data.forEach(data => {
      rangePoints.push(data.min);
      rangePoints.push(data.max);
    });

    const extentValues = d3.extent(rangePoints);

    const scaleRangeX = [margin.left, size.width - margin.right];
    const scaleRangeY = [size.height - margin.bottom, margin.top];

    const scaleValues = d3
      .scaleLinear()
      .domain([
        this.layout.axes?.x?.minimum ?? extentValues[0] ?? 0,
        this.layout.axes?.x?.maximum ?? extentValues[1] ?? 0,
      ])
      .nice()
      .range(this.isHorizontal() ? scaleRangeX : scaleRangeY);

    const extentFreq = d3.extent(this.data.data, data => data.frequency);

    const scaleFreq = d3
      .scaleLinear()
      .domain([
        0,
        this.layout.axes?.y?.maximum ?? extentFreq[1] ?? 0,
      ])
      .nice()
      .range(this.isHorizontal() ? scaleRangeY : scaleRangeX);

    this.scaleX = this.isHorizontal() ? scaleValues : scaleFreq;
    this.scaleY = this.isHorizontal() ? scaleFreq : scaleValues;
  }

  /** Initializes the elements for the histogram plot. */
  private setupElements() {
    if (this.container) {
      // Create the SVG element.
      const { svg } = createSvg(this.container, this.layout);

      this.svgSel = svg;

      // Setup the zoom behavior.
      this.zoomSel = this.svgSel.append("g");

      // Create the histogram plot elements.
      this.rectsSel = this.zoomSel.append("g").selectAll("rect");

      this.setupAxisElements();
    }
  }

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return super.container;
  }
  public set container(value: HTMLElement | undefined) {
    super.container = value;
    this.setupElements();
  }
  public get layout(): IHistogramPlotLayout {
    return { ...super.layout };
  }
  public set layout(value: IHistogramPlotLayout) {
    super.layout = value;
    this.setupScales();

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }
  public get data(): IHistogramPlotData {
    return { ...super.data };
  }
  public set data(value: IHistogramPlotData) {
    super.data = value;
    this.setupScales();
  }
  // #endregion

  /** Renders a plot of the graph. */
  public render() {
    const scaleValues = this.scaleX;
    const scaleFreq = this.scaleY;
    // Update the points.
    this.rectsSel = this.rectsSel?.data(this._data.data)
      .join("rect")
      .attr("fill", d => d.style?.fillColor ?? "#53b853")
      .attr("stroke", d => d.style?.strokeColor ?? "none")
      .style("paint-order", "fill")
      .attr("stroke-width", d => d.style?.strokeWidth ?? 0);

    if (this.isHorizontal()) {
      this.rectsSel?.attr("x", d => scaleValues(d.min) + (d.style?.strokeWidth ?? 0) + 1)
        .attr("y", d => scaleFreq(d.frequency))
        .attr("width", d => Math.max(0, scaleValues(d.max) - scaleValues(d.min) - (d.style?.strokeWidth ?? 0) - 1))
        .attr("height", d => scaleFreq(0) - scaleFreq(d.frequency));
    } else {
      this.rectsSel?.attr("x", d => scaleValues(0))
        .attr("y", d => scaleFreq(d.max) + (d.style?.strokeWidth ?? 0) + 1)
        .attr("width", d => scaleValues(d.frequency) - scaleValues(0))
        .attr("height", d => Math.max(0, scaleFreq(d.min) - scaleFreq(d.max) - (d.style?.strokeWidth ?? 0) - 1));
    }
  }
}

export default HistogramPlot;
export type {
  IHistogramBin,
  IHistogramPlotData,
  IHistogramPlotLayout,
  IHistogramPlotEvents,
};
