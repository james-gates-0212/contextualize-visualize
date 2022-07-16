import * as d3 from "d3";
import { IPlotLayout, IPlotStyle, PlotWithAxis, Selection } from "types";
import { createSvg } from "utility";

/** The type of datum for each histogram plot point. */
interface IHistogramBin {
  /** The relative frequency of the histogram bin. */
  frequency: number;

  /** The minimum value of the bin. */
  min: number;
  /** The maximum value of the bin. */
  max: number;

  /** Whether the bin is selected. */
  selected?: boolean;

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
  /** Display method for horizontal or vertical. */
  orientation: "horizontal" | "vertical";
  /** Determine to normalize the data between 0 and 1. */
  normalize?: boolean;
}

/** The events that may be emitted from a histogram plot. */
interface IHistogramPlotEvents {
  /** An event listener that is called when a bin is called exactly once (does not fire on double click). */
  singleClickBin: (bin: IHistogramBin) => void;
  /** An event listener that is called when a bin is clicked exactly twice (does not fire on single click). */
  doubleClickBin: (bin: IHistogramBin) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

/**
 * An object that persists, renders, and handles information about a histogram plot in 2D.
 */
class HistogramPlot extends PlotWithAxis<IHistogramPlotData, IHistogramPlotLayout, IHistogramPlotEvents> {
  // #region DOM
  private rectsSel?: Selection<SVGGElement, IHistogramBin, SVGGElement>;
  private freqsSel?: Selection<SVGGElement, IHistogramBin, SVGGElement>;
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
    this.setupEvents();
    this.setupScales();
  }

  private isHorizontal() {
    return this.layout.orientation === "horizontal";
  }

  private isVertical() {
    return this.layout.orientation === "vertical";
  }

  /** Calculate a total to normalize. */
  private total2Normalize() {
    return this.layout.normalize
      ? d3.sum(this.data.data, d => d.frequency)
      : 1;
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

    const total = this.total2Normalize();
    const extentFreq = d3.extent(this.data.data, d => d.frequency / total);

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

      this.svgSel = svg.on("click", (e: PointerEvent) => {
        this.notify("clickSpace");
      });

      this.setupAxisElements();

      this.contentSel = this.svgSel.append("g");

      // Create the histogram plot elements.
      this.rectsSel = this.contentSel.append("g")
        .style("cursor", "pointer")
        .selectAll("rect");
      this.freqsSel = this.contentSel.append("g")
        .selectAll("text");
    }
  }

  /** Bind the events for the elements. */
  private setupEvents() {
    this
      .on("singleClickBin", (bin) => {
        bin.selected = !bin.selected;
        this.render();
      })
      .on("clickSpace", () => {
        this._data.data.forEach(bin => bin.selected = false);
        this.render();
      });
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

    const total = this.total2Normalize();

    const frequency = (d: IHistogramBin) => d.frequency / total;

    const strokeWidth = (d: IHistogramBin) => d.style?.strokeWidth ?? 0;

    const x = (d: IHistogramBin) =>
      (
        this.isHorizontal()
          ? (scaleValues(d.min) + 1)
          : scaleValues(0)
      ) + strokeWidth(d) / 2;

    const y = (d: IHistogramBin) =>
      (
        this.isHorizontal()
          ? scaleFreq(frequency(d))
          : (scaleFreq(d.max) + 1)
      ) + strokeWidth(d) / 2;

    const width = (d: IHistogramBin) =>
      this.isHorizontal()
        ? Math.max(1, scaleValues(d.max) - scaleValues(d.min) - strokeWidth(d) - 1)
        : scaleValues(frequency(d)) - scaleValues(0) - strokeWidth(d);

    const height = (d: IHistogramBin) =>
      this.isHorizontal()
        ? scaleFreq(0) - scaleFreq(frequency(d)) - strokeWidth(d)
        : Math.max(1, scaleFreq(d.min) - scaleFreq(d.max) - strokeWidth(d) - 1);

    const offset = "1em";

    const topX = (d: IHistogramBin) => x(d) + width(d) / (this.isHorizontal() ? 2 : 1);
    const topY = (d: IHistogramBin) => y(d) + (this.isHorizontal() ? 0 : (height(d) / 2));

    const onClickBin = (e: PointerEvent, bin: IHistogramBin) => {
      switch (e.detail) {
        case 1: {
          e.stopPropagation();
          this.notify("singleClickBin", bin);
          break;
        }
      }
    };

    // Update the bins.
    this.rectsSel = this.rectsSel?.data(this._data.data.sort((a, b) => b.frequency - a.frequency))
      .join("rect")
      .attr("fill", d => d.style?.fillColor ?? "#53b853")
      .attr("stroke", d => d.style?.strokeColor ?? "none")
      .style("paint-order", "fill")
      .attr("stroke-width", d => d.style?.strokeWidth ?? 0)
      .attr("x", x)
      .attr("y", y)
      .attr("width", width)
      .attr("height", height)
      .on("click", onClickBin);

    this.rectsSel?.selectAll("title").remove();
    this.rectsSel?.append("title")
      .text(d => [
        `${d.min} ≤ x < ${d.max}`,
        `${this.layout.normalize ? "Normalized: " : ""}${d3.format(",")(frequency(d))}`,
        `${this.layout.normalize ? "Original: " + d3.format(",")(d.frequency) : ""}`,
      ].join("\n").trim());

    this.freqsSel = this.freqsSel?.data(this._data.data)
      .join("text")
      .attr("alignment-baseline", "middle")
      .attr("text-anchor", this.isHorizontal() ? "middle" : "start")
      .attr("dx", this.isHorizontal() ? null : offset)
      .attr("dy", this.isHorizontal() ? "-" + offset : null)
      .attr("x", topX)
      .attr("y", topY)
      .text(d => d.selected ? d3.format(",")(frequency(d)) : "")
      .on("click", onClickBin);
  }
}

export default HistogramPlot;
export type {
  IHistogramBin,
  IHistogramPlotData,
  IHistogramPlotLayout,
  IHistogramPlotEvents,
};
