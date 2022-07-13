import * as d3 from "d3";
import { createSvg } from "utility";
import EventDriver from "./EventDriver";
import { Selection } from "./Selection";

type AxisSel = Selection<SVGGElement, unknown, HTMLElement>;
type AxisScale = d3.ScaleLinear<number, number>;
type ScaleColor = d3.ScaleSequential<string> | d3.ScaleOrdinal<number, string>;

class PlotWithAxis<TLayout, TEvent> extends EventDriver<TEvent> {
  // #region DOM
  protected _container?: HTMLElement;
  protected xAxisSel?: AxisSel;
  protected yAxisSel?: AxisSel;
  protected svgSel?: Selection<SVGSVGElement, unknown, HTMLElement>;
  protected zoomSel?: Selection<SVGGElement, unknown, HTMLElement>;
  // #endregion

  // #region Extensions
  protected zoomExt: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Data
  protected _layout: TLayout;
  protected _scaleX: AxisScale;
  protected _scaleY: AxisScale;
  protected _scaleColor: ScaleColor;
  // #endregion

  public constructor() {
    super();
    this._layout = {} as TLayout;

    // Initialize the scales.
    this._scaleX = d3.scaleLinear();
    this._scaleY = d3.scaleLinear();
    this._scaleColor = d3.scaleSequential();

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
        this.zoomSel?.attr("transform", transform.toString());
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

  protected set scaleColor(value: ScaleColor) {
    this._scaleColor = value;
  }

  protected get scaleColor(): ScaleColor {
    return this._scaleColor;
  }
  // #endregion

  /** Reset the axes. */
  protected resetAxis() {
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

  /** Creates an x-axis for the plot. */
  protected xAxis(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    g?.attr("transform", `translate(0, ${size.height - margin.bottom})`).call(
      d3.axisBottom(scale)
    );
  }

  /** Creates an y-axis for the plot. */
  protected yAxis(g: AxisSel | undefined, scale: AxisScale) {
    const { margin } = createSvg(undefined, this._layout);
    g?.attr("transform", `translate(${margin.left}, 0)`).call(
      d3.axisLeft(scale)
    );
  }

  /** Creates an x-axis grid for the plot. */
  protected xAxisGrid(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    const activeXAxisGrid = (this._layout as any).axes?.x?.showLines;
    if (activeXAxisGrid) {
      g?.attr('opacity', '0.5').attr("transform", `translate(0, ${size.height - margin.bottom})`).call(
        d3.axisBottom(scale).tickSize(-(size.height-margin.top-margin.bottom))
      );
    }
  }

  /** Creates an y-axis grid for the plot. */
  protected yAxisGrid(g: AxisSel | undefined, scale: AxisScale) {
    const { size, margin } = createSvg(undefined, this._layout);
    const activeYAxisGrid = (this._layout as any).axes?.y?.showLines;
    if (activeYAxisGrid) {
      g?.attr('opacity', '0.5').attr("transform", `translate(${margin.left}, 0)`).call(
        d3.axisLeft(scale).tickSize(-(size.width-margin.left-margin.right))
      );
    }
  }

}

export default PlotWithAxis;
