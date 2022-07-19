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
  /** A unique identifier for data to plot. */
  id: string;
  /** The text label for data to plot. */
  label?: string;
  /** The data to plot. */
  data: TDatum[];
  /** The color to use in plot. */
  color?: string;
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

/** The named or indexed min and max simultaneously. */
interface IExtents {
  /** The indexed min & max simultaneously. */
  [key: string | number]: [number | undefined, number | undefined];
}

/**
 * An object that persists, renders, and handles information about a line plot in 2D.
 */
class LinePlot extends PlotWithAxis<
  ILinePlotData[],
  ILinePlotLayout,
  ILinePlotEvents
> {
  // #region DOM
  private pointsSel?: Selection<SVGGElement, ILinePoint, SVGGElement>;
  private linesSel?: Selection<SVGGElement, TLineSegment, SVGGElement>;
  private labelsSel?: Selection<SVGGElement, ILinePlotData, SVGGElement>;
  // #endregion

  // #region Data
  private _pointIDs: string[];
  private _points: ILinePoint[];
  private _lineIDs: string[];
  private _lines: TLineSegment[];
  // #endregion

  /**
   * Constructs a new line plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: ILinePlotData | ILinePlotData[],
    layout?: ILinePlotLayout,
    container?: HTMLElement
  ) {
    super(LinePlot.safeData(data), layout, container);

    // Set the data.
    this._container = container;
    this._layout = layout ?? {};
    this._data = LinePlot.safeData(data);
    this._pointIDs = [];
    this._points = [];
    this._lineIDs = [];
    this._lines = [];

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
  }

  /**
   * Make a safe data for a line plot.
   * @param data to plot.
   * @returns ILinePlotData[]
   */
  static safeData(data?: ILinePlotData | ILinePlotData[]): ILinePlotData[] {
    return !data ? [] : Array.isArray(data) ? data : [data];
  }

  /**
   * Get the min and max simultaneously from the data array to plot.
   * @param data The data array to plot.
   * @param cb The callback to pick a value for extent.
   * @returns The min and max simultaneously.
   */
  private extent(data: ILinePlotData[], cb: Function) {
    let numbers: number[] = [];
    data.forEach((e) => {
      numbers = numbers.concat(...e.data.map((d) => cb(d)));
    });
    return d3.extent(numbers);
  }

  /** Initializes the scales used to transform data for the line plot. */
  private setupScales() {
    // Get the metrics for the SVG element.
    const { size, margin } = createSvg(undefined, this.layout);

    // Find the range of values.
    const extentX = this.extent(this.data, (d: ILinePoint) => d.x);
    const extentY = this.extent(this.data, (d: ILinePoint) => d.y);
    const extentColor = this.extent(this.data, (d: ILinePoint) => d.value);

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

    this.data.forEach((d) => {
      this.scaleColors[d.id] = findColormap(d.colormap);
      if (extentColor[0] !== undefined && extentColor[1] !== undefined) {
        this.scaleColors[d.id].domain(extentColor);
      }
    });

    this._pointIDs = [];
    this._points = [];
    this._lineIDs = [];
    this._lines = [];

    this.data.forEach((d) => {
      d.data.forEach((pt, i, a) => {
        this._pointIDs.push([d.id, pt.id].join("-"));
        this._points.push(pt);
        this._lineIDs.push([d.id, pt.id, a[i + 1]?.id].join("-"));
        this._lines.push(i === a.length - 1 ? [pt] : [pt, a[i + 1]]);
      });
    });
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

      this.contentSel = this.svgSel.append("g");

      // Setup the zoom behavior.
      if (this.zoomExt) {
        this.svgSel
          .call(this.zoomExt)
          .call(this.zoomExt.transform, d3.zoomIdentity);
      }

      // Create the line plot elements.
      this.linesSel = this.contentSel.append("g").selectAll("line");
      this.pointsSel = this.contentSel.append("g").selectAll("circle");
      this.labelsSel = this.contentSel.append("g").selectAll("text");

      this.setupAxisElements();
    }
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    // Get the size of the SVG element.
    if (!this.contentSel) return;
    const {
      size: { width, height },
    } = createSvg(undefined, this.layout);

    // Get the bounds of the data.
    const xExtent = this.extent(this.data, (d: ILinePoint) => d.x);
    const yExtent = this.extent(this.data, (d: ILinePoint) => d.y);

    // Check for invalid bounds.
    if (xExtent[0] === undefined || xExtent[1] === undefined) return;
    if (yExtent[0] === undefined || yExtent[1] === undefined) return;

    // Perform the zooming.
    const padding = 0.25;
    const [xMin, xMax] = xExtent as [number, number];
    const [yMin, yMax] = yExtent as [number, number];
    if (this.zoomExt) {
      this.contentSel
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
  public get data(): ILinePlotData[] {
    return super.data;
  }
  public set data(value: ILinePlotData | ILinePlotData[]) {
    super.data = LinePlot.safeData(value);
    this.setupScales();
  }
  // #endregion

  /** Renders a plot of the graph. */
  public render() {
    const dataID = (combined: string, id: string) =>
      combined.substring(0, combined.lastIndexOf(id) - 1);
    const dataIDFromPoint = (d: ILinePoint, i: number) =>
      dataID(this._pointIDs[i], d.id);
    const dataIDFromLine = (d: TLineSegment, i: number) =>
      dataID(this._lineIDs[i], d.map((e) => e.id).join("-"));
    const parentFromPoint = (d: ILinePoint, i: number) =>
      this.data.find((e) => e.id === dataIDFromPoint(d, i));
    const parentFromLine = (d: TLineSegment, i: number) =>
      this.data.find((e) => e.id === dataIDFromLine(d, i));
    // Update the points.
    this.pointsSel = this.pointsSel
      ?.data(
        this._points.filter((d) => d.style?.fillRadius ?? 0),
        (d, i) => this._pointIDs[i]
      )
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
      .attr("fill", (d, i) =>
        d.value !== undefined
          ? this.scaleColors[dataIDFromPoint(d, i)](d.value)
          : parentFromPoint(d, i)?.color ?? d.style?.fillColor ?? "#53b853"
      )
      .attr("stroke", (d) => d.style?.strokeColor ?? "none")
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 0);

    const connectLine = d3
      .line<[number, number]>()
      .defined((d) => !isNaN(d[1]))
      .x((d) => this.scaleX(d[0]))
      .y((d) => this.scaleY(d[1]));

    this.linesSel = this.linesSel
      ?.data(this._lines, (d, i) => this._lineIDs[i])
      .join("path")
      .attr("d", (d) => connectLine(d.map((e) => [e.x ?? 0, e.y ?? 0])))
      .attr("stroke", (d, i) =>
        d[0].value !== undefined
          ? this.scaleColors[dataIDFromLine(d, i)](d[0].value)
          : parentFromLine(d, i)?.color ?? d[0].style?.strokeColor ?? "#53b853"
      )
      .attr("stroke-width", (d) => d[0].style?.strokeWidth ?? 1);

    if (this.data.length > 1) {
      this.labelsSel = this.labelsSel
        ?.data(this.data, (d) => d.id)
        .join("text")
        .attr("x", (d) => this.scaleX(d.data[d.data.length - 1].x ?? 0))
        .attr("y", (d) => this.scaleY(d.data[d.data.length - 1].y ?? 0))
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", "end")
        .attr("fill", (d) => d.color ?? null)
        .text((d) => d.label ?? d.id ?? "");
    }
  }
}

export default LinePlot;
export type { ILinePoint, ILinePlotData, ILinePlotLayout, ILinePlotEvents };
