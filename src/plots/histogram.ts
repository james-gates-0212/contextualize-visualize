import * as d3 from "d3";
import { EventDriver, IPlotLayout, IPlotStyle } from "types";
import { createSvg, findColormap } from "utility";

/** A more concise type to handle d3.Selection types. */
type Selection<
  GElement extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<GElement, Datum, PElement, PDatum>;

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
interface IHistogramPlotLayout extends IPlotLayout<"histogram"> {}
/** The events that may be emitted from a histogram plot. */
interface IHistogramPlotEvents {
  /** An event listener that is called when a point is called exactly once (does not fire on double click). */
  singleClickPoint: (point: IHistogramBin) => void;
  /** An event listener that is called when a point is clicked exactly twice (does not fire on single click). */
  doubleClickPoint: (point: IHistogramBin) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

/**
 * An object that persists, renders, and handles information about a histogram plot in 2D.
 */
class HistogramPlot extends EventDriver<IHistogramPlotEvents> {
  // #region DOM
  private _container?: HTMLElement;

  private svgSel?: Selection<SVGSVGElement, unknown, HTMLElement>;
  private zoomSel?: Selection<SVGGElement, unknown, HTMLElement>;
  private xAxisSel?: Selection<SVGGElement, unknown, HTMLElement>;
  private yAxisSel?: Selection<SVGGElement, unknown, HTMLElement>;
  private rectsSel?: Selection<SVGGElement, IHistogramBin, SVGGElement>;
  // #endregion

  // #region Extensions
  private zoomExt: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Data
  private _data: IHistogramPlotData<IHistogramBin>;
  private _layout: IHistogramPlotLayout;

  private scaleX: d3.ScaleLinear<number, number>;
  private scaleY: d3.ScaleLinear<number, number>;
  private scaleColor:
    | d3.ScaleSequential<string>
    | d3.ScaleOrdinal<number, string>;
  // #endregion

  /**
   * Constructs a new histogram plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: IHistogramPlotData<IHistogramBin>,
    layout?: IHistogramPlotLayout,
    container?: HTMLElement,
  ) {
    super();

    // Set the data.
    this._data = data ?? { data: [] };
    this._layout = layout ?? {};
    this._container = container;

    // Initialize the scales.
    this.scaleX = d3.scaleLinear();
    this.scaleY = d3.scaleLinear();
    this.scaleColor = d3.scaleSequential();

    // Initialize the extensions.
    this.zoomExt = d3
      .zoom<SVGSVGElement, unknown>()
      .filter((event: any) => !event.button && event.type !== "dblclick")
      .on("zoom", ({ transform }: { transform: d3.ZoomTransform }) => {
        const scaleXZoom = transform.rescaleX(this.scaleX);
        const scaleYZoom = transform.rescaleY(this.scaleY);
        this.xAxis(this.xAxisSel, scaleXZoom);
        this.yAxis(this.yAxisSel, scaleYZoom);
        this.xAxisGrid(this.xAxisSel, scaleXZoom);
        this.yAxisGrid(this.yAxisSel, scaleYZoom);

        this.zoomSel?.attr("transform", transform.toString());
      });

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
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

    const isHorizontal = !!this.layout.axes?.x?.label;

    const scaleValues = d3
      .scaleLinear()
      .domain([
        this.layout.axes?.x?.minimum ?? extentValues[0] ?? 0,
        this.layout.axes?.x?.maximum ?? extentValues[1] ?? 0,
      ])
      .nice()
      .range(isHorizontal ? scaleRangeX : scaleRangeY);


    const extentFreq = d3.extent(this.data.data, data => data.frequency);
    const scaleFreq = d3
      .scaleLinear()
      .domain([
        this.layout.axes?.y?.minimum ?? extentFreq[0] ?? 0,
        this.layout.axes?.y?.maximum ?? extentFreq[1] ?? 0,
      ])
      .nice()
      .range(isHorizontal ? scaleRangeY : scaleRangeX);

    this.scaleX = isHorizontal ? scaleValues : scaleFreq;
    this.scaleY = isHorizontal ? scaleFreq : scaleValues;

    // Reset the axes.
    if (this.zoomSel) {
      const transform = d3.zoomTransform(this.zoomSel.node()!);
      const scaleXZoom = transform.rescaleX(this.scaleX);
      const scaleYZoom = transform.rescaleY(this.scaleY);
      this.xAxis(this.xAxisSel, scaleXZoom);
      this.yAxis(this.yAxisSel, scaleYZoom);
      this.xAxisGrid(this.xAxisSel, scaleXZoom);
      this.yAxisGrid(this.yAxisSel, scaleYZoom);
    }
  }

  /** Initializes the elements for the histogram plot. */
  private setupElements() {
    if (this.container) {
      // Create the SVG element.
      const { svg, size, margin } = createSvg(this.container, this.layout);
      const axisX = this.layout.axes?.x ?? {};
      const axisY = this.layout.axes?.y ?? {};
      const axisLabelColor = this.layout.style?.color ?? "";

      this.svgSel = svg;
      this.svgSel.on("click", (event) => {
        if (event.target === event.currentTarget) this.notify("clickSpace");
      });

      // Setup the zoom behavior.
      this.zoomSel = this.svgSel.append("g");
      this.svgSel
        .call(this.zoomExt)
        .call(this.zoomExt.transform, d3.zoomIdentity);

      // Create the axes.
      this.xAxisSel = this.svgSel.append("g")
        .attr("transform", `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(this.scaleX).tickSizeOuter(0));

      this.yAxisSel = this.svgSel.append("g")
        .attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(this.scaleY));

      // Create the histogram plot elements.
      this.rectsSel = this.zoomSel.append("g").selectAll("rect");

      // Add x axis label
      this.svgSel.append("text")
        .attr("x", margin.left + (size.width - margin.left - margin.right) / 2)
        .attr("y", size.height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", axisLabelColor)
        .text(<string> axisX.label || "Frequency");

      // Add y axis label
      this.svgSel.append("text")
        .attr("x", -(margin.top + (size.height - margin.top - margin.bottom) / 2))
        .attr("y", margin.right)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("fill", axisLabelColor)
        .text(<string> axisY.label || "Frequency");
    }
  }

  /** Creates an x-axis for the plot. */
  private xAxis(g: typeof this.xAxisSel, scale: typeof this.scaleX) {
    const { size, margin } = createSvg(undefined, this.layout);
    g?.attr("transform", `translate(0, ${size.height - margin.bottom})`).call(
      d3.axisBottom(scale)
    );
  }
  /** Creates an y-axis for the plot. */
  private yAxis(g: typeof this.yAxisSel, scale: typeof this.scaleY) {
    const { margin } = createSvg(undefined, this.layout);
    g?.attr("transform", `translate(${margin.left}, 0)`).call(
      d3.axisLeft(scale)
    );
  }

  /** Creates an x-axis grid for the plot. */
  private xAxisGrid(g: typeof this.xAxisSel, scale: typeof this.scaleX) {
    const { size, margin } = createSvg(undefined, this.layout);
    const activeXAxisGrid = this.layout.axes?.x?.showLines;
    if (activeXAxisGrid) {
      g?.attr('opacity', '0.5').attr("transform", `translate(0, ${size.height - margin.bottom})`).call(
        d3.axisBottom(scale).tickSize(-(size.height-margin.top-margin.bottom))
      );
    }
  }
  /** Creates an y-axis grid for the plot. */
  private yAxisGrid(g: typeof this.yAxisSel, scale: typeof this.scaleY) {
    const { size, margin } = createSvg(undefined, this.layout);
    const activeYAxisGrid = this.layout.axes?.y?.showLines;
    if (activeYAxisGrid) {
      g?.attr('opacity', '0.5').attr("transform", `translate(${margin.left}, 0)`).call(
        d3.axisLeft(scale).tickSize(-(size.width-margin.left-margin.right))
      );
    }
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    // Get the size of the SVG element.
    if (!this.zoomSel) return;
    const {
      size: { width, height },
    } = createSvg(undefined, this.layout);

    // Get the bounds of the data.
    const rangePoints: number[] = [];
    this.data.data.forEach(data => {
      rangePoints.push(data.min);
      rangePoints.push(data.max);
    });
    const xExtent = d3.extent(rangePoints);
    const yExtent = d3.extent(this._data.data, ({ frequency }) => frequency);

    // Check for invalid bounds.
    if (xExtent[0] === undefined || xExtent[1] === undefined) return;
    if (yExtent[0] === undefined || yExtent[1] === undefined) return;

    // Perform the zooming.
    const padding = 0.25;
    const [xMin, xMax] = xExtent as [number, number];
    const [yMin, yMax] = yExtent as [number, number];
    this.zoomSel
      .transition()
      .duration(500)
      .call(
        this.zoomExt.transform as any,
        d3.zoomIdentity
          .scale(
            (1 + padding) *
              Math.max((xMax - xMin) / width, (yMax - yMin) / height)
          )
          .translate(-(xMin + xMax) / 2, -(yMin + yMax) / 2)
      );
  }
  // #endregion

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return this._container;
  }
  public set container(value: HTMLElement | undefined) {
    this._container = value;
    this.setupElements();
  }
  public get layout(): IHistogramPlotLayout {
    return { ...this._layout };
  }
  public set layout(value: IHistogramPlotLayout) {
    this._layout = value;
    this.setupScales();

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }
  public get data(): IHistogramPlotData<IHistogramBin> {
    return { ...this._data };
  }
  public set data(value: IHistogramPlotData<IHistogramBin>) {
    this._data = value;
    this.setupScales();
  }
  //#endregion

  /** Renders a plot of the graph. */
  public render() {
    const isHorizontal = !!this.layout.axes?.x?.label;
    const scaleValues = this.scaleX;
    const scaleFreq = this.scaleY;
    // Update the points.
    this.rectsSel = this.rectsSel?.data(this._data.data)
      .join("rect")
      .attr("fill", d => d.style?.fillColor ?? "#000")
      .attr("r", d => d.style?.fillRadius ?? 5)
      .attr("stroke", d => d.style?.strokeColor ?? "#000")
      .attr("stroke-width", d => d.style?.strokeWidth ?? 0);

    if (isHorizontal) {
      this.rectsSel?.attr("x", d => scaleValues(d.min) + 1)
        .attr("y", d => scaleFreq(d.frequency))
        .attr("width", d => Math.max(0, scaleValues(d.max) - scaleValues(d.min) - 1))
        .attr("height", d => scaleFreq(0) - scaleFreq(d.frequency));
    } else {
      this.rectsSel?.attr("x", d => scaleValues(0) + 1)
        .attr("y", d => scaleFreq(d.max))
        .attr("width", d => scaleValues(d.frequency) - scaleValues(0) - 1)
        .attr("height", d => Math.max(0, scaleFreq(d.min) - scaleFreq(d.max)));
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
