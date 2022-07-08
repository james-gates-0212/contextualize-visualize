import * as d3 from "d3";
import { EventDriver, IPlotLayout, IPlotStyle } from "types";
import { createSvg } from "utility";

/** A more concise type to handle d3.Selection types. */
type Selection<
  GElement extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<GElement, Datum, PElement, PDatum>;

/** Represents a locator element for the plot. */
interface ITreeLocator {
  /** The vertex that the locator corresponds to. */
  vertex: ITreeVertex;
  /** The x-coordinate of the locator arrow. */
  x: number;
  /** The y-coordinate of the locator arrow. */
  y: number;
  /** The angle of the locator arrow. */
  rotation: number;
  /** The scale of the locator arrow. */
  scale: number;
  /** The color of the locator arrow. */
  color: string;
}
/** Represents a vertex to plot. */
interface ITreeVertex extends d3.HierarchyPointNode<ITreePlotData> {
  /** The unique identifier of the vertex. */
  id: string;

  /** The label of the vertex. */
  label?: string;

  /** Whether the vertex is currently selected. */
  selected?: boolean;
  /** Whether the vertex is currently expanded. */
  expanded?: boolean;

  /** The styling to be applied to the vertex. */
  style?: IPlotStyle;
}
/** Represents an edge to plot. */
interface ITreeEdge extends d3.HierarchyPointLink<ITreeVertex> {
  /** Whether the vertex is directed. */
  directed: boolean;

  /** The label of the edge. */
  label?: string;

  /** The styling to be applied to the edge. */
  style?: IPlotStyle;
}

/** Represents the data contained in the plot. */
interface ITreePlotData {
  /** The unique identifier of the vertex. */
  id?: string;

  /** The children of the vertex. */
  children?: this[];

  /** The label of the vertex. */
  label?: string;

  /** Whether the vertex is currently selected. */
  selected?: boolean;
  /** Whether the vertex is currently expanded. */
  expanded?: boolean;

  /** The styling to be applied to the vertex. */
  style?: IPlotStyle;
}
/** Represents the layout information for the plot. */
interface ITreePlotLayout extends IPlotLayout<"graph"> {}
/** The events that may be emitted from a graph plot. */
interface ITreePlotEvents {
  /** An event listener that is called when a node is called exactly once (does not fire on double click). */
  singleClickNode: (vertex: ITreeVertex) => void;
  /** An event listener that is called when a node is clicked exactly twice (does not fire on single click). */
  doubleClickNode: (vertex: ITreeVertex) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

// TODO: Consider using WebCoLa to improve the performance of the visualization.
// TODO: Make sure to add definitions to the SVG for optimal performance.
/**
 * An object that persists, renders, and handles information about a graph plot.
 */
class TreePlot extends EventDriver<ITreePlotEvents> {
  // #region DOM
  /** The container to hold the plot. The plot can still update without the container. */
  private _container?: HTMLElement;

  private svgSel?: Selection<SVGSVGElement, unknown, HTMLElement>;
  private zoomSel?: Selection<SVGGElement, unknown, HTMLElement>;
  private linkSel?: Selection<d3.BaseType, ITreeEdge, SVGGElement>;
  private nodeSel?: Selection<d3.BaseType, ITreeVertex, SVGGElement>;
  private textSel?: Selection<d3.BaseType, ITreeVertex, SVGGElement>;
  private locSel?: Selection<d3.BaseType, ITreeLocator, SVGGElement>;
  private selectSel?: Selection<d3.BaseType, ITreeVertex, SVGGElement>;
  // #endregion

  // #region Extensions
  private zoomExt: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Data
  private _data: ITreePlotData;
  private _layout: ITreePlotLayout;
  private _root: ITreeVertex = {} as ITreeVertex;
  private _nodes: ITreeVertex[] = [];
  private _links: ITreeEdge[] = [];
  // #endregion

  /**
   * Constructs a new graph plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container The container to hold the plot. Optional.
   */
  public constructor(
    data?: ITreePlotData,
    layout?: ITreePlotLayout,
    container?: HTMLElement
  ) {
    super();

    // Set the data.
    this._data = data ?? {} as ITreePlotData;
    this._layout = layout ?? {};
    this._container = container;

    // Initialize the extensions.
    this.zoomExt = d3
      .zoom<SVGSVGElement, unknown>()
      .filter((event: any) => !event.button && event.type !== "dblclick")
      .on("zoom", (event) => {
        this.zoomSel?.attr("transform", event.transform);
        this.tick();
      });

    // Perform setup tasks.
    this.setupElements();
  }

  /** Initializes the elements for the graph plot. */
  private setupElements() {
    if (this.container) {
      // Create the SVG element.
      const { svg, size } = createSvg(this.container, this.layout);

      this._root = d3.hierarchy(this._data, d => d.children) as ITreeVertex;

      const padding = 50;

      // Compute the layout.
      d3.tree().size([size.width - padding * 2, size.height - padding * 2])(this._root);

      // Center the tree.
      let x0 = Infinity;
      let x1 = -x0;
      this._root.each(d => {
        if (d.x > x1) x1 = d.x;
        if (d.x < x0) x0 = d.x;
      });

      this._nodes = this._root.descendants();
      this._links = this._root.links() as ITreeEdge[];

      this.svgSel = svg.attr("viewBox", [-padding, -padding, size.width, size.height]);
      this.svgSel.on("click", (event) => {
        if (event.target === event.currentTarget) this.notify("clickSpace");
      });

      // Add a definition for the arrow markers for directed edges.
      const defsSel = this.svgSel.append("defs");
      defsSel
        .append("marker")
        .attr("id", "arrow")
        .attr("viewBox", "0 -5 20 10")
        .attr("refX", 50)
        .attr("refY", 0)
        .attr("markerWidth", 10)
        .attr("markerHeight", 10)
        .attr("orient", "auto")
        .append("path")
        .attr("fill", "#999")
        .attr("d", "M0,-10L20,0L0,10");
      defsSel
        .append("path")
        .attr("id", "pointer")
        .attr("viewBox", "-5 -5 10 10")
        .attr("d", "M-3-7.5 4.5 0-3 7.5-4.5 7.5-4.5 4.5 0 0-4.5-4.5-4.5-7.5")
        .attr("opacity", 0.4);

      // Setup the zoom behavior.
      // Notice we disable the double click zoom behavior because we allow double click to be used to
      // expand/collapse nodes.
      this.zoomSel = this.svgSel.append("g");
      this.svgSel
        .call(this.zoomExt)
        .call(this.zoomExt.transform, d3.zoomIdentity);

      // Setup all of the data-related elements.
      this.linkSel = this.zoomSel.append("g").selectAll("line");
      this.nodeSel = this.zoomSel
        .append("g")
        .style("cursor", "pointer")
        .selectAll("circle");
      this.selectSel = this.zoomSel
        .append("g")
        .attr("fill", "currentcolor")
        .style("pointer-events", "none")
        .selectAll("circle");
      this.locSel = this.svgSel.append("g").selectAll("use");
      this.textSel = this.zoomSel
        .append("g")
        .attr("fill", "currentcolor")
        .style("pointer-events", "none")
        .selectAll("text");
    }
  }

  /**
   * Updates the plot by setting positions according to positions calculated by the force simulation.
   */
  private tick() {
    // Update the link source and target positions.
    if (this.linkSel) {
      this.linkSel
        .attr("x1", ({ source }) => (source as ITreeVertex).x || 0)
        .attr("y1", ({ source }) => (source as ITreeVertex).y || 0)
        .attr("x2", ({ target }) => (target as ITreeVertex).x || 0)
        .attr("y2", ({ target }) => (target as ITreeVertex).y || 0);
    }

    // Update the node positions.
    if (this.nodeSel) {
      this.nodeSel.attr("cx", ({ x }) => x || 0).attr("cy", ({ y }) => y || 0);
    }

    // Update the selection positions.
    if (this.selectSel) {
      this.selectSel
        .attr("cx", ({ x }) => x || 0)
        .attr("cy", ({ y }) => y || 0);
    }

    // Update the text positions.
    if (this.textSel) {
      const calcOffset = (r: number) => 5 + 2 * r;
      this.textSel
        .attr("x", ({ x }) => x || 0)
        .attr(
          "y",
          ({ style, y }) => (y || 0) + calcOffset(style?.fillRadius ?? 15)
        );
    }

    // Update the arrow positions.
    // Calculate the arrows that are not within the viewport.
    if (this.locSel) {
      const { size } = createSvg(undefined, this.layout, true);
      if (this.zoomSel) {
        const transform = d3.zoomTransform(this.zoomSel.node()!);
        const { x, y, k } = transform;
        const calcLocator = (v: ITreeVertex): ITreeLocator | null => {
          // Check if the vertex is within the viewport.
          if (v.x === undefined || v.y === undefined) return null;
          const sx = x + k * v.x;
          const sy = y + k * v.y;
          const r = v.style?.fillRadius ?? 15;
          if (
            sx + r >= -size.width / 2 &&
            sx - r < size.width / 2 &&
            sy + r >= -size.height / 2 &&
            sy - r < size.height / 2
          )
            return null;

          // Get a bounded position for the locator arrow.
          let bx, by: number;
          if (Math.abs(sx) * size.height <= Math.abs(sy) * size.width) {
            // Vertical clamp.
            bx = ((size.height / 2) * sx) / Math.abs(sy);
            by = Math.sign(sy) * (size.height / 2 - 15);
          } else {
            // Horizontal clamp.
            bx = Math.sign(sx) * (size.width / 2 - 15);
            by = ((size.width / 2) * sy) / Math.abs(sx);
          }
          return {
            vertex: v,
            x: bx,
            y: by,
            rotation: (Math.atan2(by, bx) * 180) / Math.PI,
            scale: (v.style?.fillRadius ?? 15) / 15,
            color: v.style?.fillColor ?? "#a1d7a1",
          };
        };
      }
    }
  }
  /**
   * Handles dragging a node in the plot.
   * @returns The drag behavior.
   */
  private drag() {
    const that = this;
    const onDragStarted = (
      event: d3.D3DragEvent<SVGCircleElement, ITreeVertex, ITreeVertex>
    ) => {
    };
    const onDragEnded = (
      event: d3.D3DragEvent<SVGCircleElement, ITreeVertex, ITreeVertex>
    ) => {
    };
    const onDragged = (
      event: d3.D3DragEvent<SVGCircleElement, ITreeVertex, ITreeVertex>
    ) => {
    };

    return d3
      .drag<SVGCircleElement, ITreeVertex, SVGElement>()
      .on("start", onDragStarted)
      .on("end", onDragEnded)
      .on("drag", onDragged);
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    // Get the size of the SVG element.
    if (!this.zoomSel) return;
    const {
      size: { width, height },
    } = createSvg(undefined, this.layout);

    // Perform the zooming.
    const padding = 0.25;
    const [xMin, xMax] = [0, width];
    const [yMin, yMax] = [0, height];

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

  public get layout(): ITreePlotLayout {
    return { ...this._layout };
  }

  public set layout(value: ITreePlotLayout) {
    this._layout = value;

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value, true);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }

  public get data(): ITreePlotData {
    return { ...this._data };
  }

  public set data(value: ITreePlotData) {
    this._data = value;
  }
  // #endregion

  /**
   * Renders a plot of the graph.
   * Should be called when data is updated.
   */
  public render() {
    this.linkSel = this.linkSel?.data(this._links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) => d.style?.strokeColor ?? "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 1)
      .attr("marker-end", ({ directed }) => (directed ? "url(#arrow)" : null))
      .attr("d", d3.linkVertical<ITreeEdge, Number[]>()
        .source(d => [d.source.x, d.source.y])
        .target(d => [d.target.x, d.target.y]));

    this.nodeSel = this.nodeSel?.data(this._nodes)
      .join("circle")
      .attr("r", (d) => d.style?.fillRadius ?? 15)
      .attr("fill", (d) => d.style?.fillColor ?? "#a1d7a1")
      .attr("fill-opacity", (d) => `${d.expanded ? 0 : 100}%`)
      .attr("stroke", (d) => d.style?.strokeColor ?? "#53b853")
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 2.5);

    this.textSel = this.textSel?.data(this._nodes)
      .join("text")
      .attr("text-anchor", "middle")
      .text((d) => d.data.label ?? "");

    this.tick();
  }
}

export default TreePlot;
export type {
  ITreeVertex,
  ITreeEdge,
  ITreePlotData,
  ITreePlotLayout,
  ITreePlotEvents,
};
