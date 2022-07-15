import * as d3 from "d3";
import { BasePlot, IPlotLayout, IPlotStyle, PlotWithAxis, Selection } from "types";
import { createSvg, findColormap } from "utility";

/** The type of datum for each donut plot point. */
interface IDonutBin {
  /** A text label for the bin. */
  label?: string;

  /** The value of the bin. Determines the size of the bin. */
  value: number;

  /** The optional styles to apply to the bin. */
  style?: IPlotStyle;
}

/** Represents the data contained in the plot. */
interface IDonutPlotData<TDatum extends IDonutBin = IDonutBin> {
  /** The data to plot. */
  data: TDatum[];
  /** The colormap to use for mapping values to colors. */
  colormap?: string;
}

/** Represents the layout information for the plot. */
interface IDonutPlotLayout extends IPlotLayout<"donut"> {
  /** Text label for the donut layout. */
  label?: string;
  /** Whether to display as a percent. */
  percent?: boolean;
}

/** The events that may be emitted from a donut plot. */
interface IDonutPlotEvents {
  /** An event listener that is called when a bin is called exactly once (does not fire on double click). */
  singleClickBin: (bin: IDonutBin) => void;
  /** An event listener that is called when a bin is clicked exactly twice (does not fire on single click). */
  doubleClickBin: (bin: IDonutBin) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

/**
 * An object that persists, renders, and handles information about a donut plot in 2D.
 */
class DonutPlot extends BasePlot<IDonutPlotData, IDonutPlotLayout, IDonutPlotEvents> {
  // #region DOM
  private arcsSel?:       Selection<SVGGElement, d3.PieArcDatum<IDonutBin>, SVGGElement, IDonutBin[]>;
  private labelsSel?:     Selection<SVGGElement, d3.PieArcDatum<IDonutBin>, SVGGElement, IDonutBin[]>;
  private valuesSel?:     Selection<SVGGElement, d3.PieArcDatum<IDonutBin>, SVGGElement, IDonutBin[]>;
  private layoutLabel?:   Selection<SVGGElement, string, SVGGElement, IDonutBin[]>;
  // #endregion

  // #region Data
  private _values: string[];
  // #endregion

  /**
   * Constructs a new donut plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: IDonutPlotData,
    layout?: IDonutPlotLayout,
    container?: HTMLElement,
  ) {
    super(data, layout, container);

    // Set the data.
    this._container = container;
    this._layout = layout ?? {};
    this._data = data ?? { data: [] };
    this._values = [];

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
  }

  /** Initializes the scales used to transform data for the donut plot. */
  private setupScales() {
    // Filter the data for the donut.
    const total = d3.sum(this._data.data, d => d.value);
    this._values = this._data.data.map(d => {
      const percentage = d.value * 100 / total;
      const result = this._layout.percent
        ? (
          percentage >= 1
            ? Math.round(percentage)
            : parseFloat(percentage.toFixed(1))
        )
        : d.value;
      return d3.format(",")(result) + (this._layout.percent ? "%" : "");
    });
    // Create the scalars for the data.
    this.scaleColor = findColormap(this._data.colormap ?? "rainbow");
  }

  /** Initializes the elements for the donut plot. */
  private setupElements() {
    if (this.container) {
      // Create the SVG element.
      const { svg, size } = createSvg(this.container, this.layout);

      this.svgSel = svg
        .attr("viewBox", [-size.width / 2, -size.height / 2, size.width, size.height]);

      // Create the donut plot elements.
      this.arcsSel = this.svgSel.append("g")
        .datum(this._data.data)
        .selectAll("path");
      this.labelsSel = this.svgSel.append("g")
        .attr("font-weight", "bold")
        .datum(this._data.data)
        .selectAll("text");
      this.valuesSel = this.svgSel.append("g")
        .datum(this._data.data)
        .selectAll("text");
      this.layoutLabel = this.svgSel.append("g").selectAll("text");
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

  public get layout(): IDonutPlotLayout {
    return { ...super.layout };
  }
  public set layout(value: IDonutPlotLayout) {
    super.layout = value;
    this.setupScales();

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }

  public get data(): IDonutPlotData {
    return { ...super.data };
  }
  public set data(value: IDonutPlotData) {
    super.data = value;
    this.setupScales();
  }
  // #endregion

  /** Renders a plot of the graph. */
  public render() {
    const { size } = createSvg(undefined, this._layout);
    const dim = Math.min(size.width, size.height);
    const radius = dim / 2;
    const innerRadius = radius / 2;
    const outerRadius = radius / 4;
    const cornerRadius = 5;
    const padAngle = 2 / radius;

    const pie = d3.pie<IDonutBin>()
      .startAngle(Math.PI / 180)
      .endAngle(Math.PI / 180 + 2 * Math.PI)
      .value(d => d.value)
      .sort(null);

    const arc = d3.arc<d3.PieArcDatum<IDonutBin>>()
      .innerRadius(innerRadius)
      .outerRadius(d => (d.data.style?.fillRadius ?? outerRadius) + innerRadius)
      .cornerRadius(cornerRadius)
      .padAngle(padAngle);

    this.arcsSel = this.arcsSel
      ?.data(pie)
      .join("path")
      .attr("fill", (d, i, a) => d.data.style?.fillColor ?? this.scaleColor(i / a.length))
      .attr("stroke", d => d.data.style?.strokeColor ?? "currentColor")
      .attr("stroke-width", d => d.data.style?.strokeWidth ?? 0)
      .attr("d", arc);

    const need2Flip = (d: d3.PieArcDatum<IDonutBin>) => (
      (d.startAngle + d.endAngle) > Math.PI &&
      (d.startAngle + d.endAngle) < Math.PI * 3
    );

    this.labelsSel = this.labelsSel
      ?.data(pie)
      .join("text")
      .attr("dy", d => need2Flip(d) ? "+2.5em" : "-2em")
      .attr("text-anchor", "middle")
      .attr("transform", d => [
        `rotate(${(d.startAngle + d.endAngle) / 2 * 180 / Math.PI})`,
        `translate(0,-${(d.data.style?.fillRadius ?? outerRadius) + innerRadius})`,
        `rotate(${need2Flip(d) ? 180 : 0})`,
      ].join(" ").trim())
      .text(d => d.data.value > 0 ? (d.data.label ?? "") : "");

    this.valuesSel = this.valuesSel
      ?.data(pie)
      .join("text")
      .attr("dy", d => need2Flip(d) ? "+1.2em" : "-0.5em")
      .attr("text-anchor", "middle")
      .attr("transform", d => [
        `rotate(${(d.startAngle + d.endAngle) / 2 * 180 / Math.PI})`,
        `translate(0,-${(d.data.style?.fillRadius ?? outerRadius) + innerRadius})`,
        `rotate(${need2Flip(d) ? 180 : 0})`,
      ].join(" ").trim())
      .text((d, i) => d.data.value > 0 ? (this._values[i] ?? "") : "");

    if (this._layout.label) {
      this.layoutLabel = this.layoutLabel
        ?.data([this._layout.label])
        .join("text")
        .attr("text-anchor", "middle")
        .text(d => d);
    }
  }
}

export default DonutPlot;
export type {
  IDonutBin,
  IDonutPlotData,
  IDonutPlotLayout,
  IDonutPlotEvents,
};
