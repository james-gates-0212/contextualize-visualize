import * as d3 from "d3";
import { EventDriver, IPlotLayout, IPlotStyle } from "types";
import { createSvg } from "utility";
import { IGraphPlotLayout } from "./graph";
import sampleData from "../stories/tree.sample";

/** A more concise type to handle d3.Selection types. */
type Selection<
  GElement extends d3.BaseType,
  Datum = unknown,
  PElement extends d3.BaseType = null,
  PDatum = undefined
> = d3.Selection<GElement, Datum, PElement, PDatum>;

/** Tree Layouts */
type TTreeLayout = "none" | "horizontal" | "vertical" | "radial/circular";

/** Represents a vertex to plot. */
interface ITreeVertex extends d3.HierarchyPointNode<ITreePlotData> {}
/** Represents an edge to plot. */
interface ITreeEdge extends d3.HierarchyPointLink<ITreeVertex> {
  offset?: {
    x?: number;
    y?: number;
  };
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

  offset?: {
    x?: number;
    y?: number;
  };

  /** The styling to be applied to the vertex. */
  style?: IPlotStyle;
}
/** The events that may be emitted from a tree plot. */
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
 * An object that persists, renders, and handles information about a tree plot.
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
  private selectSel?: Selection<d3.BaseType, ITreeVertex, SVGGElement>;
  // #endregion

  // #region Extensions
  private zoomExt: d3.ZoomBehavior<SVGSVGElement, unknown>;
  // #endregion

  // #region Data
  private _data: ITreePlotData[] = [];
  private _layout: IGraphPlotLayout;
  private _treeLayout: TTreeLayout;
  private _roots: ITreeVertex[] = [];
  private _nodes: ITreeVertex[] = [];
  private _links: ITreeEdge[] = [];
  private _linkMethods = new Map<String, any>([
    [
      "vertical",
      d3.linkVertical<ITreeEdge, number[]>()
        .source(d => [d.source.x, d.source.y])
        .target(d => [d.target.x, d.target.y]),
    ],
    [
      "horizontal",
      d3.linkHorizontal<ITreeEdge, number[]>()
        .source(d => [d.source.x, d.source.y])
        .target(d => [d.target.x, d.target.y]),
    ],
    [
      "radial/circular",
      d3.linkRadial<ITreeEdge, ITreeVertex>()
        .angle(d => d.x)
        .radius(d => d.y),
    ],
  ]);
  private _defaultRadius = 15;
  // #endregion

  /**
   * Constructs a new tree plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container The container to hold the plot. Optional.
   */
  public constructor(
    data?: ITreePlotData[],
    layout?: IGraphPlotLayout,
    container?: HTMLElement
  ) {
    super();

    // Set the data.
    // this._data = sampleData;
    this._data = data ?? [];
    this._layout = layout ?? {};
    this._container = container;
    this._treeLayout = "none";

    // Initialize the extensions.
    this.zoomExt = d3
      .zoom<SVGSVGElement, unknown>()
      .filter((event: any) => !event.button && event.type !== "dblclick")
      .on("zoom", (event) => {
        this.zoomSel?.attr("transform", event.transform);
      });

    // Perform setup tasks.
    this.setupElements();
  }

  private isNone() {
    return this._treeLayout === "none";
  }

  private isRadial() {
    return this._treeLayout === "radial/circular";
  }

  private isVertical() {
    return this._treeLayout === "vertical";
  }

  private isHorizontal() {
    return this._treeLayout === "horizontal";
  }

  private setupHierarchyTree(data: ITreePlotData, offsetY: number = 0) {
    const root = d3.hierarchy(data).sort((a, b) => d3.ascending(a.data.label, b.data.label)) as ITreeVertex;

    const totalLeaves = root.leaves().length > 40 ? root.leaves().length : 40;
    const minSize = this._defaultRadius ** 2 * totalLeaves / (1.5 * (this.isRadial() ? Math.sqrt(this._defaultRadius) * Math.PI : 1));
    const radius =  minSize;
    const treeWidth = radius / Math.sqrt(this._defaultRadius);
    const treeHeight = radius / this._defaultRadius;
    const maxSize = this.isRadial() ? radius * 2 : Math.max(treeWidth, treeHeight);

    // Compute the layout.
    if (this.isRadial()) {
      // d3.cluster().size([2 * Math.PI, radius - 100]) .separation((a, b) => (a.parent == b.parent ? 1 : 3) / a.depth)(root);
      d3.tree().size([2 * Math.PI, radius]).separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth)(root);
    } else {
      d3.tree().size([treeWidth, treeHeight])(root);
    }

    const swap = (node: any) => {
      if (this.isHorizontal()) {
        if (node.x !== undefined && node.y !== undefined) {
          const t = node.x;
          node.x = node.y;
          node.y = t;
        }
      }
      return node;
    };

    root.each(swap);

    this._roots.push(root);

    root.descendants().forEach(node => {
      if (this.isRadial()) {
        node.data.offset = {
          y: offsetY + (offsetY > 0 ? radius : 0)
        };
      } else {
        node.y += offsetY;
      }
      this._nodes.push(node);
    });
    (root.links() as ITreeEdge[]).forEach(link => {
      if (this.isRadial()) {
        link.offset = {
          y: offsetY + (offsetY > 0 ? radius : 0),
        };
      }
      this._links.push(link);
    });

    return {
      treeWidth,
      treeHeight,
      maxSize,
    };
  }

  /** Initializes the elements for the tree plot. */
  private setupElements() {
    if (this.isNone()) {
      this.delete();
      return;
    }
    if (this.container) {
      // Create the SVG element.
      const { svg, size } = createSvg(this.container, this.layout, this.isRadial());

      const padding = 200;

      let contentWidth = padding;
      let contentHeight = this.isRadial() ? 0 : padding;
      let maxContentSize = 1;
      let prevMaxSize = 0;

      this._data.forEach((data, index) => {
        const {
          treeWidth,
          treeHeight,
          maxSize
        } = this.setupHierarchyTree(
          data,
          this.isRadial()
            ? (prevMaxSize / 2 + index * padding)
            : contentHeight
        );
        prevMaxSize += maxSize;
        contentWidth = Math.max(contentWidth, this.isVertical() ? treeWidth : treeHeight);
        contentHeight += (this.isVertical() ? treeHeight : treeWidth) + padding;
        maxContentSize = Math.max(contentWidth, contentHeight, maxSize);
      });

      this.svgSel = svg
        .style("box-sizing", "border-box")
        .attr("preserveAspectRatio", "xMidYMid meet");
      if (this.isRadial()) {
        this._nodes.reverse();
      }
      this.svgSel.on("click", (event) => {
        if (event.target === event.currentTarget) this.notify("clickSpace");
      });

      // Setup the zoom behavior.
      // Notice we disable the double click zoom behavior because we allow double click to be used to
      // expand/collapse nodes.
      const viewPortMax = this.isVertical() ? size.width : Math.min(size.width, size.height);
      const scaleRate = viewPortMax / maxContentSize;
      const translateForm = {
        x: 0,
        y: 0,
      };
      if (this.isVertical()) {
        translateForm.y = (size.height - contentHeight * scaleRate) / 2;
      }
      if (this.isHorizontal()) {
        translateForm.x = (size.width - contentWidth * scaleRate) / 2;
      }
      this.zoomSel = this.svgSel.append("g");
      this.svgSel
        .call(this.zoomExt)
        .call(
          this.zoomExt.transform,
          d3.zoomIdentity
            .translate(translateForm.x, translateForm.y)
            .scale(scaleRate)
        );

      // Setup all of the data-related elements.
      this.linkSel = this.zoomSel
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 3)
        .selectAll("path");
      this.nodeSel = this.zoomSel
        .append("g")
        .style("cursor", "pointer")
        .selectAll("circle");
      this.selectSel = this.zoomSel
        .append("g")
        .attr("fill", "currentcolor")
        .style("pointer-events", "none")
        .selectAll("circle");
      this.textSel = this.zoomSel
        .append("g")
        .attr("fill", "currentcolor")
        .style("pointer-events", "none")
        .selectAll("text");
    }
  }

  private delete() {
    if (this.svgSel) {
      this.svgSel.remove();
      this.svgSel = undefined;
    }
  }

  /**
   * Updates the plot by setting positions according to positions calculated by the force simulation.
   */
  private tick() {
    if (this.isNone()) return;
    // Update the link source and target positions.
    if (this.linkSel) {
      this.linkSel
        .attr("x1", ({ source }) => (source as ITreeVertex).x || 0)
        .attr("y1", ({ source }) => (source as ITreeVertex).y || 0)
        .attr("x2", ({ target }) => (target as ITreeVertex).x || 0)
        .attr("y2", ({ target }) => (target as ITreeVertex).y || 0);
    }

    // Update the node positions.
    if (this.nodeSel && !this.isRadial()) {
      this.nodeSel
        .attr("cx", ({ x }) => x || 0)
        .attr("cy", ({ y }) => y || 0);
    }

    // Update the selection positions.
    if (this.selectSel) {
      this.selectSel
        .attr("cx", ({ x }) => x || 0)
        .attr("cy", ({ y }) => y || 0);
    }
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    // Get the size of the SVG element.
    if (!this.zoomSel || this.isNone()) return;
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

  // #region Hierarchy Tree Layout Getters/Setters
  public get treeLayout(): TTreeLayout {
    return this._treeLayout ?? "none";
  }

  public set treeLayout(value: TTreeLayout) {
    this._treeLayout = value;
    this.setupElements();
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

  public get data(): ITreePlotData[] {
    return [ ...this._data ];
  }

  public set data(value: ITreePlotData[]) {
    this._data = value;
  }
  // #endregion

  /**
   * Renders a plot of the tree.
   * Should be called when data is updated.
   */
  public render() {
    if (this.isNone()) {
      this.delete();
      return;
    }

    this.linkSel = this.linkSel?.data(this._links)
      .join("path")
      .attr("d", this._linkMethods.get(this._treeLayout ?? "none"))
      .attr("transform", d => `translate(0, ${d.offset?.y || 0})`);

    this.nodeSel = this.nodeSel?.data(this._nodes)
      .join("circle")
      .attr("r", (d) => d.data.style?.fillRadius ?? this._defaultRadius)
      .attr("fill", (d) => d.data.style?.fillColor ?? "#a1d7a1")
      .attr("fill-opacity", (d) => `${d.data.expanded ? 0 : 100}%`)
      .attr("stroke", (d) => d.data.style?.strokeColor ?? "#53b853")
      .attr("stroke-width", (d) => d.data.style?.strokeWidth ?? 2.5);

    const calcOffset = (d:ITreeVertex) => (d.children ? -1 : 1) * ((d.data.style?.fillRadius ?? this._defaultRadius) + 5);

    this.textSel = this.textSel?.data(this._nodes)
      .join("text")
      .attr("text-anchor", d => {
        let children = d.data.children;
        let check = d.children || (children && children.length > 0);
        if (!this.isRadial()) {
          return check ? "end" : "start";
        }
        return d.x < Math.PI === !check ? "start" : "end";
      })
      .text(d => d.data.label ?? "")
      .attr("dy", "0.31em")
      .style("font-weight", d => {
        let children = d.data.children;
        return d.children || (children && children.length > 0) ? "bold" : "normal";
      })
      .attr("x", d => (d.x || 0) + calcOffset(d))
      .attr("y", d => d.y || 0)
      .attr("transform", d =>
        this.isVertical()
          ? `rotate(${90} ${d.x || 0},${d.y || 0})`
          : null
      );

    if (this.isRadial()) {
      this.nodeSel?.attr("transform", d => [
        `translate(0, ${d.data.offset?.y || 0})`,
        `rotate(${d.x * 180 / Math.PI - 90})`,
        `translate(${d.y}, 0)`
      ].join(' '));
      this.textSel?.attr("x", 0).attr("y", 0)
        .attr("transform", d => [
          `translate(0, ${d.data.offset?.y || 0})`,
          `rotate(${d.x * 180 / Math.PI - 90})`,
          `translate(${d.y + calcOffset(d)}, 0)`,
          `${d.x >= Math.PI ? "rotate(180)" : ""}`,
        ].join(' ')
      );
    }

    this.textSel?.clone().lower()
      .attr("stroke", "white")
      .attr("stroke-width", 4)
      .text(d => d.data.label ?? "");

    this.tick();
  }
}

export default TreePlot;
export type {
  ITreeVertex,
  ITreeEdge,
  ITreePlotData,
  ITreePlotEvents,
  TTreeLayout,
};
