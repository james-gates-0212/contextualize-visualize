import * as d3 from "d3";
import { EventDriver, IPlotLayout, IPlotStyle } from "types";
import * as TreePlot from "./tree";
import { createSvg } from "utility";

/** A more concise type to handle d3.Selection types. */
type Selection<
  GElement extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<GElement, Datum, PElement, PDatum>;

/** Represents a locator element for the plot. */
interface IGraphLocator {
  /** The vertex that the locator corresponds to. */
  vertex: IGraphVertex;
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
interface IGraphVertex extends d3.SimulationNodeDatum {
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
interface IGraphEdge extends d3.SimulationLinkDatum<IGraphVertex> {
  /** Whether the vertex is directed. */
  directed: boolean;
  /** The unique identifier of the source vertex. */
  source: string | IGraphVertex;
  /** The unique identifier of the target vertex. */
  target: string | IGraphVertex;

  /** The label of the edge. */
  label?: string;

  /** The styling to be applied to the edge. */
  style?: IPlotStyle;
}

/** Represents the data contained in the plot. */
interface IGraphPlotData {
  /** The vertices. */
  vertices: IGraphVertex[];
  /** The edges. */
  edges: IGraphEdge[];
}
/** Represents the layout information for the plot. */
interface IGraphPlotLayout extends IPlotLayout<"graph"> {}
/** The events that may be emitted from a graph plot. */
interface IGraphPlotEvents {
  /** An event listener that is called when a node is called exactly once (does not fire on double click). */
  singleClickNode: (vertex: IGraphVertex) => void;
  /** An event listener that is called when a node is clicked exactly twice (does not fire on single click). */
  doubleClickNode: (vertex: IGraphVertex) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

// TODO: Consider using WebCoLa to improve the performance of the visualization.
// TODO: Make sure to add definitions to the SVG for optimal performance.
/**
 * An object that persists, renders, and handles information about a graph plot.
 */
class GraphPlot extends EventDriver<IGraphPlotEvents> {
  // #region DOM
  /** The container to hold the plot. The plot can still update without the container. */
  private _container?: HTMLElement;

  private svgSel?: Selection<SVGSVGElement, unknown, HTMLElement>;
  private zoomSel?: Selection<SVGGElement, unknown, HTMLElement>;
  private linkSel?: Selection<d3.BaseType, IGraphEdge, SVGGElement>;
  private nodeSel?: Selection<d3.BaseType, IGraphVertex, SVGGElement>;
  private textSel?: Selection<d3.BaseType, IGraphVertex, SVGGElement>;
  private locSel?: Selection<d3.BaseType, IGraphLocator, SVGGElement>;
  private selectSel?: Selection<d3.BaseType, IGraphVertex, SVGGElement>;
  // #endregion

  // #region Extensions
  private forceExt: d3.Simulation<IGraphVertex, IGraphEdge>;
  private zoomExt: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Forces
  private _forceNode: d3.Force<IGraphVertex, IGraphEdge>;
  private _forceLink: d3.Force<IGraphVertex, IGraphEdge>;
  private _forceX: d3.Force<IGraphVertex, IGraphEdge>;
  private _forceY: d3.Force<IGraphVertex, IGraphEdge>;
  // #endregion

  // #region Data
  private _data: IGraphPlotData;
  private _layout: IGraphPlotLayout;
  // #endregion

  // #region Hierarchy Tree
  private _treeData: Array<TreePlot.ITreePlotData>;
  private _treePlot: TreePlot.default | undefined;
  private _treeLayout: TreePlot.TTreeLayout;
  // #endregion

  /**
   * Constructs a new graph plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container The container to hold the plot. Optional.
   */
  public constructor(
    data?: IGraphPlotData,
    layout?: IGraphPlotLayout,
    container?: HTMLElement
  ) {
    super();

    // Set the data.
    this._data = data ?? { vertices: [], edges: [] };
    this._layout = layout ?? {};
    this._container = container;

    // Setup the forces.
    this._forceNode = d3.forceManyBody().strength(-500);
    this._forceLink = d3
      .forceLink<IGraphVertex, IGraphEdge>()
      .id(({ id }) => id)
      .strength(0.2);
    this._forceX = d3.forceX(0).strength(0.05);
    this._forceY = d3.forceY(0).strength(0.05);

    // Setup the tree layout.
    this._treeLayout = "none";
    this._treeData = [];

    // Initialize the extensions.
    this.zoomExt = d3
      .zoom<SVGSVGElement, unknown>()
      .filter((event: any) => !event.button && event.type !== "dblclick")
      .on("zoom", (event) => {
        this.zoomSel?.attr("transform", event.transform);
        this.tick();
      });
    this.forceExt = d3
      .forceSimulation<IGraphVertex, IGraphEdge>()
      .force("link", this._forceLink)
      .force("charge", this._forceNode)
      .force("forceX", this._forceX)
      .force("forceY", this._forceY)
      .on("tick", this.tick.bind(this));

    // Perform setup tasks.
    this.setupElements();
    this.setupSimulation();
    this.setupHierarchyTree();
  }

  private delete() {
    if (this.svgSel) {
      this.svgSel.remove();
      this.svgSel = undefined;
    }
  }

  /** Initializes the elements for the graph plot. */
  private setupElements() {
    if (!this.isNoneTreeLayout()) {
      this.delete();
      return;
    }
    if (this.container) {
      // Create the SVG element.
      const { svg } = createSvg(this.container, this.layout, true);
      this.svgSel = svg;
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

  private setupSimulation() {
    if (!this.isNoneTreeLayout()) return;
    // Set the data within the force simulation.
    this.forceExt.nodes(this._data.vertices);
    this.forceExt
      .force<d3.ForceLink<IGraphVertex, IGraphEdge>>("link")
      ?.links(this._data.edges);
  }

  private setupHierarchyTree() {
    // Set the data for hierarchy tree structure.
    if (this.container) {
      const vertices = this._data.vertices;
      const edges = this._data.edges;
      const container = this.container;
      const layout = this.layout;
      const withChildren = (parent: IGraphVertex) => {
        const root:TreePlot.ITreePlotData = {
          id: parent.id,
          label: parent.label,
          selected: parent.selected,
          expanded: parent.expanded,
          style: parent.style,
          children: [],
        };
        root.children = vertices.filter(
          child => !!edges.find(
            ({ source, target }) => (source as IGraphVertex).id === parent.id && (target as IGraphVertex).id === child.id
          )
        ).map(
          child => withChildren(child)
        );
        return root;
      };
      this._treeData = vertices.filter(
        vertex => !edges.find(({ target }) => (target as IGraphVertex).id === vertex.id)
      ).map(
        vertex => withChildren(vertex)
      );
      this._treePlot = new TreePlot.default(this._treeData, layout, container);
    }
  }

  private isNoneTreeLayout() {
    return this._treeLayout === "none";
  }

  /**
   * Updates the plot by setting positions according to positions calculated by the force simulation.
   */
  private tick() {
    if (!this.isNoneTreeLayout()) {
      return;
    }
    // Update the link source and target positions.
    if (this.linkSel) {
      this.linkSel
        .attr("x1", ({ source }) => (source as IGraphVertex).x || 0)
        .attr("y1", ({ source }) => (source as IGraphVertex).y || 0)
        .attr("x2", ({ target }) => (target as IGraphVertex).x || 0)
        .attr("y2", ({ target }) => (target as IGraphVertex).y || 0);
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
        const calcLocator = (v: IGraphVertex): IGraphLocator | null => {
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
        const locators = this._data.vertices
          .map(calcLocator)
          .filter((l): l is IGraphLocator => l !== null);
        this.locSel = this.locSel
          .data(locators, (l) => l.vertex.id)
          .join("use")
          .attr("href", "#pointer")
          .style(
            "transform",
            ({ x, y, scale, rotation }) =>
              `translate(${x}px,${y}px) rotate(${rotation}deg) scale(${scale})`
          )
          .attr("fill", ({ color }) => color);
        // // .attr("xlink:href", (v) => `#${v.id}`) // TODO: Add a on click event to focus on the node.
      }
    }
  }
  /**
   * Handles dragging a node in the plot.
   * @returns The drag behavior.
   */
  private drag() {
    if (!this.isNoneTreeLayout()) {
      return;
    }
    const that = this;
    const onDragStarted = (
      event: d3.D3DragEvent<SVGCircleElement, IGraphVertex, IGraphVertex>
    ) => {
      that.forceExt.alphaTarget(1).restart();
      if (!event.active) that.forceExt.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };
    const onDragEnded = (
      event: d3.D3DragEvent<SVGCircleElement, IGraphVertex, IGraphVertex>
    ) => {
      if (!event.active) that.forceExt.alphaTarget(0.0);
      event.subject.fx = null;
      event.subject.fy = null;
    };
    const onDragged = (
      event: d3.D3DragEvent<SVGCircleElement, IGraphVertex, IGraphVertex>
    ) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    return d3
      .drag<SVGCircleElement, IGraphVertex, SVGElement>()
      .on("start", onDragStarted)
      .on("end", onDragEnded)
      .on("drag", onDragged);
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    // Get the size of the SVG element.
    if (!this.zoomSel || !this.isNoneTreeLayout()) return;
    const {
      size: { width, height },
    } = createSvg(undefined, this.layout);

    // Get the bounds of the data.
    const xExtent = d3.extent(this._data.vertices, ({ x }) => x);
    const yExtent = d3.extent(this._data.vertices, ({ y }) => y);

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

  // #region Force Getters/Setters
  public get forceNode(): d3.Force<IGraphVertex, IGraphEdge> {
    return this._forceNode;
  }
  public set forceNode(value: d3.Force<IGraphVertex, IGraphEdge>) {
    this._forceNode = value;
    this.forceExt.force("charge", value);
  }
  public get forceLink(): d3.Force<IGraphVertex, IGraphEdge> {
    return this._forceLink;
  }
  public set forceLink(value: d3.Force<IGraphVertex, IGraphEdge>) {
    this._forceLink = value;
    this.forceExt.force("link", value);
  }
  public get forceX(): d3.Force<IGraphVertex, IGraphEdge> {
    return this._forceX;
  }
  public set forceX(value: d3.Force<IGraphVertex, IGraphEdge>) {
    this._forceX = value;
    this.forceExt.force("x", value);
  }
  public get forceY(): d3.Force<IGraphVertex, IGraphEdge> {
    return this._forceY;
  }
  public set forceY(value: d3.Force<IGraphVertex, IGraphEdge>) {
    this._forceY = value;
    this.forceExt.force("y", value);
  }
  // #endregion

  // #region Hierarchy Tree Layout Getters/Setters
  public get treeLayout(): TreePlot.TTreeLayout {
    return this._treeLayout ?? "none";
  }

  public set treeLayout(value: TreePlot.TTreeLayout) {
    this._treeLayout = value;
    (this._treePlot as TreePlot.default).treeLayout = value;
  }
  // #endregion

  // #region Plot Getters/Setters
  public get container(): HTMLElement | undefined {
    return this._container;
  }
  public set container(value: HTMLElement | undefined) {
    this._container = value;
    this.setupElements();
    this.setupHierarchyTree();
  }
  public get layout(): IGraphPlotLayout {
    return { ...this._layout };
  }
  public set layout(value: IGraphPlotLayout) {
    this._layout = value;

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value, true);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }
  public get data(): IGraphPlotData {
    return { ...this._data };
  }
  public set data(value: IGraphPlotData) {
    // We want to preserve positioning and velocity of nodes that are still in the graph.
    const mapOld = new Map(this._data.vertices.map((node) => [node.id, node]));
    const mapNew = new Map(value.vertices.map((node) => [node.id, node]));

    const nodes = value.vertices.map((node) => {
      const existNode = mapOld.get(node.id);
      if (!existNode) return node;
      else {
        const { id, label, expanded, selected, style, ...rest } = node;
        return {
          ...rest,
          ...existNode,
          id,
          label,
          expanded,
          selected,
          style,
        };
      }
    });
    const links = value.edges
      .filter(
        (edge) =>
          mapNew.has(edge.source as string) && mapNew.has(edge.target as string)
      )
      .map((edge) => ({ ...edge }));

    this._data = { vertices: nodes, edges: links };
    this.setupSimulation();
    this.setupHierarchyTree();
  }
  // #endregion

  /**
   * Triggers simulation of the graph.
   * Should be called when vertices or edges have been added or removed.
   */
  public simulate(alpha: number = 1.0) {
    if (!this.isNoneTreeLayout()) return;
    this.forceExt.alpha(alpha).restart();
  }

  private defaultRender() {
    if (!this.isNoneTreeLayout()) {
      this.delete();
      return;
    }
    // Update the nodes.
    this.nodeSel = this.nodeSel
      ?.data(this._data.vertices, (d) => d.id)
      .join("circle")
      .call(this.drag() as any)
      .on("click", (e: PointerEvent, d) => {
        switch (e.detail) {
          case 1:
            this.notify("singleClickNode", d);
            break;
          case 2:
            this.notify("doubleClickNode", d);
            break;
        }
      })

      // Styling is applied based on defaults and the styling passed along with the data.
      .attr("r", (d) => d.style?.fillRadius ?? 15)
      .attr("fill", (d) => d.style?.fillColor ?? "#a1d7a1")
      .attr("fill-opacity", (d) => `${d.expanded ? 0 : 100}%`)
      .attr("stroke", (d) => d.style?.strokeColor ?? "#53b853")
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 2.5);

    // Update the links.
    this.linkSel = this.linkSel
      ?.data(this._data.edges, ({ source, target }) => source + "-" + target)
      .join("line")

      // Styling is applied based on defaults and the styling passed olong with the data.
      .attr("fill", (d) => d.style?.strokeColor ?? "#999")
      .attr("stroke", (d) => d.style?.strokeColor ?? "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 1)
      .attr("marker-end", ({ directed }) => (directed ? "url(#arrow)" : null));

    // Update the selection.
    const selectedVertices = this._data.vertices.filter((d) => d.selected);
    this.selectSel = this.selectSel
      ?.data(selectedVertices, (d) => d.id)
      .join("circle")
      .attr("r", (d) => (d.style?.fillRadius ?? 15) / 3)
      .attr("fill", "currentcolor");

    // Update the text.
    this.textSel = this.textSel
      ?.data(this._data.vertices, (d) => d.id)
      .join("text")
      .text(({ label }) => label ?? "")
      .attr("text-anchor", "middle");

    this.tick();
  }

  public treeRender() {
    if (this.isNoneTreeLayout()) {
      return;
    }
    this._treePlot?.render();
  }

  /**
   * Renders a plot of the graph.
   * Should be called when data is updated.
   */
  public render() {
    this.defaultRender();
    this.treeRender();
  }
}

export default GraphPlot;
export type {
  IGraphVertex,
  IGraphEdge,
  IGraphPlotData,
  IGraphPlotLayout,
  IGraphPlotEvents,
};
