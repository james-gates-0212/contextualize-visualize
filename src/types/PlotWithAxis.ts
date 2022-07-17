import * as d3 from "d3";
import { createSvg } from "utility";
import BasePlot from "./BasePlot";
import { IPlotLayout } from "./IPlotLayout";
import { Selection } from "./Selection";

type AxisSel = Selection<SVGGElement, unknown, HTMLElement>;
type AxisScale = d3.ScaleLinear<number, number>;

class PlotWithAxis<TData, TLayout extends IPlotLayout<string>, TEvent> extends BasePlot<TData, TLayout, TEvent> {
  // #region DOM
  protected xAxisSel?: AxisSel;
  protected yAxisSel?: AxisSel;
  // #endregion

  // #region Data
  protected _scaleX: AxisScale;
  protected _scaleY: AxisScale;
  // #endregion

  public constructor(data?: TData, layout?: TLayout, container?: HTMLElement) {
    super(data, layout, container);

    // Initialize the scales.
    this._scaleX = d3.scaleLinear();
    this._scaleY = d3.scaleLinear();

    // Initialize the extensions.
    this.zoomExt = d3
      .zoom<SVGSVGElement, unknown>()
      .filter((event: any) => !event.button && event.type !== "dblclick")
      .on("zoom", ({ transform }: { transform: d3.ZoomTransform }) => {
        const scaleXZoom = transform.rescaleX(this._scaleX);
        const scaleYZoom = transform.rescaleY(this._scaleY);
        this.xAxis(this.xAxisSel, scaleXZoom);
        this.yAxis(this.yAxisSel, scaleYZoom);
        this.xAxisGrid(this.xAxisSel, scaleXZoom);
        this.yAxisGrid(this.yAxisSel, scaleYZoom);
        this.contentSel?.attr("transform", transform.toString());
      });
  }

  // #region the scales' Getters/Setters.
  protected set scaleX(value: AxisScale) {
    this._scaleX = value;
    this.resetAxis();
  }
  protected get scaleX(): AxisScale {
    return this._scaleX;
  }
  protected set scaleY(value: AxisScale) {
    this._scaleY = value;
    this.resetAxis();
  }
  protected get scaleY(): AxisScale {
    return this._scaleY;
  }
  // #endregion

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return super.container;
  }
  public set container(value: HTMLElement | undefined) {
    super.container = value;
  }
  public get layout(): TLayout {
    return { ...super.layout };
  }
  public set layout(value: TLayout) {
    super.layout = value;
  }
  public get data(): TData {
    return super.data;
  }
  public set data(value: TData) {
    super.data = value;
  }
  // #endregion

  /** Setup elements for axis */
  protected setupAxisElements() {
    if (this.svgSel) {
      const { size, margin } = createSvg(undefined, this._layout);

      const axisX = this._layout.axes?.x ?? {};
      const axisY = this._layout.axes?.y ?? {};
      const axisLabelColor = this._layout.style?.color ?? "";

      // Create the axes.
      this.xAxisSel = this.svgSel.append("g").lower();
      this.yAxisSel = this.svgSel.append("g").lower();

      // Add x axis label
      this.svgSel
        .append("text")
        .attr("x", margin.left + (size.width - margin.left - margin.right) / 2)
        .attr("y", size.height - 5)
        .attr("text-anchor", "middle")
        .attr("fill", axisLabelColor)
        .text(axisX.label ?? "");

      // Add y axis label
      this.svgSel
        .append("text")
        .attr("x", -(margin.top + (size.height - margin.top - margin.bottom) / 2))
        .attr("y", margin.right)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("fill", axisLabelColor)
        .text(axisY.label ?? "");
    }
  }

  /** Reset the axes. */
  protected resetAxis() {
    if (this.contentSel) {
      const transform = d3.zoomTransform(this.contentSel.node()!);
      const scaleXZoom = transform.rescaleX(this.scaleX);
      const scaleYZoom = transform.rescaleY(this.scaleY);
      this.xAxis(this.xAxisSel, scaleXZoom);
      this.yAxis(this.yAxisSel, scaleYZoom);
      this.xAxisGrid(this.xAxisSel, scaleXZoom);
      this.yAxisGrid(this.yAxisSel, scaleYZoom);
    }
  }

  /** Creates an x-axis for the plot. */
  protected xAxis(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    g?.attr("transform", `translate(0, ${size.height - margin.bottom})`).call(d3.axisBottom(scale));
  }

  /** Creates an y-axis for the plot. */
  protected yAxis(g: AxisSel | undefined, scale: AxisScale) {
    const { margin } = createSvg(undefined, this._layout);
    g?.attr("transform", `translate(${margin.left}, 0)`).call(d3.axisLeft(scale));
  }

  /** Creates an x-axis grid for the plot. */
  protected xAxisGrid(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    const activeXAxisGrid = this._layout.axes?.x?.showLines;
    if (activeXAxisGrid) {
      g?.attr("transform", `translate(0, ${size.height - margin.bottom})`)
        .call(d3.axisBottom(scale).tickSize(-(size.height - margin.top - margin.bottom)))
        .selectAll("line")
        .attr("opacity", 0.25);
    }
  }

  /** Creates an y-axis grid for the plot. */
  protected yAxisGrid(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    const activeYAxisGrid = this._layout.axes?.y?.showLines;
    if (activeYAxisGrid) {
      g?.attr("transform", `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(scale).tickSize(-(size.width - margin.left - margin.right)))
        .selectAll("line")
        .attr("opacity", 0.25);
    }
  }
}

export default PlotWithAxis;
