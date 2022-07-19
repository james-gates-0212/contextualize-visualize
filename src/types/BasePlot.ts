import * as d3 from "d3";
import EventDriver from "./EventDriver";
import { IPlotLayout } from "./IPlotLayout";
import { Selection } from "./Selection";

type ScaleColor = d3.ScaleSequential<string> | d3.ScaleOrdinal<number, string>;

/** Named or indexed Map for a scale color. */
interface ScaleColors {
  /** The mapped scale color. */
  [key: string | number]: ScaleColor;
}

class BasePlot<
  TData,
  TLayout extends IPlotLayout<string>,
  TEvent
> extends EventDriver<TEvent> {
  // #region DOM
  protected _container?: HTMLElement;
  protected svgSel?: Selection<SVGSVGElement, unknown, HTMLElement>;
  protected contentSel?: Selection<SVGGElement, unknown, HTMLElement>;
  // #endregion

  // #region Extensions
  protected zoomExt?: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Data
  protected _data: TData;
  protected _layout: TLayout;
  protected _scaleColor: ScaleColor;
  protected _scaleColors: ScaleColors;
  // #endregion

  public constructor(data?: TData, layout?: TLayout, container?: HTMLElement) {
    super();

    this._data = data ?? ({} as TData);
    this._layout = layout ?? ({} as TLayout);
    this._container = container;

    this._scaleColor = d3.scaleSequential();
    this._scaleColors = {};
  }

  // #region the scales' Getters/Setters.
  protected set scaleColor(value: ScaleColor) {
    this._scaleColor = value;
  }
  protected get scaleColor(): ScaleColor {
    return this._scaleColor;
  }
  protected set scaleColors(value: ScaleColors) {
    this._scaleColors = value;
  }
  protected get scaleColors(): ScaleColors {
    return this._scaleColors;
  }
  // #endregion

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return this._container;
  }
  public set container(value: HTMLElement | undefined) {
    this._container = value;
  }
  public get layout(): TLayout {
    return { ...this._layout };
  }
  public set layout(value: TLayout) {
    this._layout = value;
  }
  public get data(): TData {
    return this._data;
  }
  public set data(value: TData) {
    this._data = value;
  }
  // #endregion
}

export default BasePlot;
