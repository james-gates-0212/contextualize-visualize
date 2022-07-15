import * as d3 from "d3";
import { IPlotLayout, IPlotStyle, PlotWithAxis, Selection } from "types";
import { createSvg, findColormap } from "utility";

type TLineSegment = ILinePoint[];

/** The type of datum for each line plot point. */
interface ILinePoint {
  /** A unique identifier for the point. */
  id: string;

  /** The x-component of the datum. */
  x?: number;
  /** The y-component of the datum. */
  y?: number;

  /** The value of the datum. Defaults to 0.0 if not specified. */
  value?: number;
  /** The weight of the datum on the line value. Defaults to 0.5 if not specified. */
  weight?: number;

  /** The optional styles to apply to the datum point. */
  style?: IPlotStyle;
}

/** Represents the data contained in the plot. */
interface ILinePlotData<TDatum extends ILinePoint = ILinePoint> {
  /** The data to plot. */
  data: TDatum[];
  /** The colormap to use for mapping values to colors. */
  colormap?: string;
}

/** Represents the layout information for the plot. */
interface ILinePlotLayout extends IPlotLayout<"line"> {}

/** The events that may be emitted from a line plot. */
interface ILinePlotEvents {
  /** An event listener that is called when a point is called exactly once (does not fire on double click). */
  singleClickPoint: (bin: ILinePoint) => void;
  /** An event listener that is called when a point is clicked exactly twice (does not fire on single click). */
  doubleClickPoint: (bin: ILinePoint) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

/**
 * An object that persists, renders, and handles information about a line plot in 2D.
 */
class LinePlot extends PlotWithAxis<ILinePlotData, ILinePlotLayout, ILinePlotEvents> {
  // #region DOM
  private pointsSel?: Selection<SVGGElement, ILinePoint, SVGGElement>;
  private linesSel?: Selection<SVGGElement, TLineSegment, SVGGElement>;
  // #endregion

  // #region Data
  private _lines: TLineSegment[];
  // #endregion

  private connectLine = d3.line()
    .defined(d => !isNaN(d[1]))
    .x(d => this.scaleX(d[0]))
    .y(d => this.scaleY(d[1]));

  /**
   * Constructs a new line plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: ILinePlotData,
    layout?: ILinePlotLayout,
    container?: HTMLElement,
  ) {
    super(data, layout, container);

    // Set the data.
    this._container = container;
    this._layout = layout ?? {};
    this._data = data ?? { data: [] };
    this._lines = [];

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
  }

  /** Initializes the scales used to transform data for the line plot. */
  private setupScales() {
    // Get the metrics for the SVG element.
    const { size, margin } = createSvg(undefined, this.layout);

    // Find the range of values.
    const extentX = d3.extent(this._data.data, (d) => d.x);
    const extentY = d3.extent(this._data.data, (d) => d.y);
    const extentColor = d3.extent(this._data.data, (d) => d.value);

    // Create the scalars for the data.
    this.scaleX = d3
      .scaleLinear()
      .domain([
        this.layout.axes?.x?.minimum ?? extentX[0] ?? 0,
        this.layout.axes?.x?.maximum ?? extentX[1] ?? 1,
      ])
      .range([margin.left, size.width - margin.right]);
    this.scaleY = d3
      .scaleLinear()
      .domain([
        this.layout.axes?.y?.minimum ?? extentY[0] ?? 0,
        this.layout.axes?.y?.maximum ?? extentY[1] ?? 1,
      ])
      .range([size.height - margin.bottom, margin.top]);

    this.scaleColor = findColormap(this._data.colormap);
    if (extentColor[0] !== undefined && extentColor[1] !== undefined)
      this.scaleColor.domain(extentColor);

    this._lines = this._data.data.map((pt, i, data) => i === data.length - 1 ? [pt] : [pt, data[i + 1]]);
  }

  /** Initializes the elements for the line plot. */
  private setupElements() {
    if (this.container) {
      // Create the SVG element.
      const { svg } = createSvg(this.container, this.layout);

      this.svgSel = svg;
      this.svgSel.on("click", (event) => {
        if (event.target === event.currentTarget) this.notify("clickSpace");
      });

      // Setup the zoom behavior.
      this.zoomSel = this.svgSel.append("g");
      if (this.zoomExt) {
        this.svgSel
          .call(this.zoomExt)
          .call(this.zoomExt.transform, d3.zoomIdentity);
      }

      // Create the line plot elements.
      this.linesSel = this.zoomSel.append("g").selectAll("line");
      this.pointsSel = this.zoomSel.append("g").selectAll("circle");

      this.setupAxisElements();
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
    const xExtent = d3.extent(this._data.data, ({ x }) => x);
    const yExtent = d3.extent(this._data.data, ({ y }) => y);

    // Check for invalid bounds.
    if (xExtent[0] === undefined || xExtent[1] === undefined) return;
    if (yExtent[0] === undefined || yExtent[1] === undefined) return;

    // Perform the zooming.
    const padding = 0.25;
    const [xMin, xMax] = xExtent as [number, number];
    const [yMin, yMax] = yExtent as [number, number];
    if (this.zoomExt) {
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
  }
  // #endregion

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return super.container;
  }
  public set container(value: HTMLElement | undefined) {
    super.container = value;
    this.setupElements();
  }
  public get layout(): ILinePlotLayout {
    return { ...super.layout };
  }
  public set layout(value: ILinePlotLayout) {
    super.layout = value;
    this.setupScales();

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }
  public get data(): ILinePlotData<ILinePoint> {
    return { ...super.data };
  }
  public set data(value: ILinePlotData) {
    super.data = value;
    this.setupScales();
  }
  // #endregion

  /** Renders a plot of the graph. */
  public render() {
    // Update the points.
    this.pointsSel = this.pointsSel
      ?.data(this._data.data.filter(d => d.style?.fillRadius ?? 0), d => d.id)
      .join("circle")
      .on("click", (e: PointerEvent, d) => {
        switch (e.detail) {
          case 1:
            this.notify("singleClickPoint", d);
            break;
          case 2:
            this.notify("doubleClickPoint", d);
            break;
        }
      })

      // Styling is applied based on defaults and the styling passed along with the data.
      .attr("cx", (d) => this.scaleX(d.x ?? 0))
      .attr("cy", (d) => this.scaleY(d.y ?? 0))
      .attr("r", (d) => d.style?.fillRadius ?? 0)
      .attr("fill", (d) =>
        d.value !== undefined
          ? this.scaleColor(d.value)
          : d.style?.fillColor ?? "#53b853"
      )
      .attr("stroke", (d) =>
        d.weight !== undefined
          ? this.scaleColor(d.weight)
          : d.style?.strokeColor ?? "none"
      )
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 0);

    this.linesSel = this.linesSel
      ?.data(this._lines)
      .join("path")
      .attr("d", d => this.connectLine(d.map(e => [e.x ?? 0, e.y ?? 0])))
      .attr("stroke", d =>
        d[0].weight !== undefined
          ? this.scaleColor(d[0].weight)
          : d[0].style?.strokeColor ?? "#53b853")
      .attr("stroke-width", d => d[0].style?.strokeWidth ?? 1);
  }
}

export default LinePlot;
export type {
  ILinePoint,
  ILinePlotData,
  ILinePlotLayout,
  ILinePlotEvents,
};
