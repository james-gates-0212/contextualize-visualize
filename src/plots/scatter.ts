import * as d3 from "d3";
import * as three from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EventDriver, IPlotLayout, IPlotStyle, PlotWithAxis, Selection } from "types";
import { createSvg, findColormap } from "utility";

// TODO: Try to automatically compute margins using canvas context (https://stackoverflow.com/questions/29031659/calculate-width-of-text-before-drawing-the-text).
//       This requires an additional 'canvas' package. We could also use 'string-pixel-width'.

/** The type of datum for each scatter plot point. */
interface IScatterPoint {
  /** A unique identifier for the point. */
  id: string;

  /** The x-component of the datum. */
  x?: number;
  /** The y-component of the datum. */
  y?: number;
  /** The z-component of the datum. */
  z?: number;

  /** The radius of the datum. Defaults to 1.0 if not specified. */
  radius?: number;
  /** The value of the datum. Defaults to 0.0 if not specified. */
  value?: number;

  /** The optional styles to apply to the datum point. */
  style?: IPlotStyle;
}
/** The type of datum for each scatter plot point with 2D guaranteed. */
interface IScatterPoint2d extends IScatterPoint {
  /** The x-component of the datum. */
  x: number;
  /** The y-component of the datum. */
  y: number;
}
/** The type of datum for each scatter plot point with 3D guaranteed. */
interface IScatterPoint3d extends IScatterPoint {
  /** The x-component of the datum. */
  x: number;
  /** The y-component of the datum. */
  y: number;
  /** The z-component of the datum. */
  z: number;
}

/** Represents the data contained in the plot. */
interface IScatterPlotData<TDatum extends IScatterPoint = IScatterPoint> {
  /** The data to plot. */
  data: TDatum[];
  /** The colormap to use for mapping values to colors. */
  colormap?: string;
}
/** Represents the layout information for the plot. */
interface IScatterPlotLayout extends IPlotLayout<"scatter"> {}
/** The events that may be emitted from a scatter plot. */
interface IScatterPlotEvents {
  /** An event listener that is called when a point is called exactly once (does not fire on double click). */
  singleClickPoint: (point: IScatterPoint) => void;
  /** An event listener that is called when a point is clicked exactly twice (does not fire on single click). */
  doubleClickPoint: (point: IScatterPoint) => void;
  /** An event listener that is called when the empty space is clicked. */
  clickSpace: () => void;
}

/**
 * An object that persists, renders, and handles information about a scatter plot in 2D.
 */
class ScatterPlot2d extends PlotWithAxis<IScatterPlotLayout, IScatterPlotEvents> {
  // #region DOM
  private pointsSel?: Selection<SVGGElement, IScatterPoint2d, SVGGElement>;
  // #endregion

  // #region Data
  private _data: IScatterPlotData<IScatterPoint2d>;

  // #endregion

  /**
   * Constructs a new scatter plot.
   * @param data Data to be plotted. Optional.
   * @param layout Layout information to be used. Optional.
   * @param container THe container to hold the plot. Optional.
   */
  public constructor(
    data?: IScatterPlotData<IScatterPoint2d>,
    layout?: IScatterPlotLayout,
    container?: HTMLElement,
  ) {
    super();

    // Set the data.
    this._data = data ?? { data: [] };
    this._layout = layout ?? {};
    this._container = container;

    // Perform setup tasks.
    this.setupElements();
    this.setupScales();
  }

  /** Initializes the scales used to transform data for the scatter plot. */
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
  }

  /** Initializes the elements for the scatter plot. */
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
      this.xAxisSel = this.svgSel.append("g");
      this.yAxisSel = this.svgSel.append("g");

      // Create the scatter plot elements.
      this.pointsSel = this.zoomSel.append("g").selectAll("circle");

      // Add x axis label
      this.svgSel.append("text")
        .attr("x", margin.left + (size.width - margin.left - margin.right) / 2)
        .attr("y", size.height-5)
        .attr("text-anchor", "middle")
        .attr("fill", axisLabelColor)
        .text(<string> axisX.label);

      // Add y axis label
      this.svgSel.append("text")
        .attr("x", -(margin.top + (size.height - margin.top - margin.bottom) / 2))
        .attr("y", margin.right)
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("fill", axisLabelColor)
        .text(<string> axisY.label);
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
  public get layout(): IScatterPlotLayout {
    return { ...this._layout };
  }
  public set layout(value: IScatterPlotLayout) {
    this._layout = value;
    this.setupScales();

    // Update the features dependent on layout.
    if (this.svgSel) {
      const { viewBox, style } = createSvg(undefined, value);
      this.svgSel.attr("viewBox", viewBox).attr("style", style);
    }
  }
  public get data(): IScatterPlotData<IScatterPoint2d> {
    return { ...this._data };
  }
  public set data(value: IScatterPlotData<IScatterPoint2d>) {
    this._data = value;
    this.setupScales();
  }
  //#endregion

  /** Renders a plot of the graph. */
  public render() {
    // Update the points.
    this.pointsSel = this.pointsSel
      ?.data(this._data.data, (d) => d.id)
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
      .attr("cx", (d) => this.scaleX(d.x))
      .attr("cy", (d) => this.scaleY(d.y))
      .attr("r", (d) => d.radius ?? d.style?.fillRadius ?? 5)
      .attr("fill", (d) =>
        d.value !== undefined
          ? this.scaleColor(d.value)
          : d.style?.fillColor ?? "#53b853"
      )
      .attr("stroke", (d) => d.style?.strokeColor ?? "none")
      .attr("stroke-width", (d) => d.style?.strokeWidth ?? 0);
  }
}

// TODO: Render an axis in the scene.
// TODO: Take into consideration distance-based scaling of radii.
// TODO: Use the point style or colormap to color the points.
// TODO: Make the background transparent and apply the axis style.
/**
 * An object that persists, renders, and handles information about a scatter plot in 3D.
 */
class ScatterPlot3d extends EventDriver<IScatterPlotEvents> {
  // #region DOM
  private _container?: HTMLElement;

  private camera: three.PerspectiveCamera;
  private scene: three.Scene;
  private renderer: three.WebGLRenderer;
  private controls: OrbitControls;
  // #endregion

  // #region Data
  private _data: IScatterPlotData<IScatterPoint3d>;
  private _layout: IScatterPlotLayout;

  private mapping: Map<
    string,
    [
      IScatterPoint3d,
      three.Mesh<three.DodecahedronGeometry, three.MeshLambertMaterial>
    ]
  >;

  private scaleColor:
    | d3.ScaleSequential<string>
    | d3.ScaleOrdinal<number, string>;
  // #endregion

  public constructor(
    data?: IScatterPlotData<IScatterPoint3d>,
    layout?: IScatterPlotLayout,
    container?: HTMLElement
  ) {
    super();

    // Set the data.
    this._data = data ?? { data: [] };
    this._layout = layout ?? {};
    this._container = container;
    this.mapping = new Map();
    this.scaleColor = d3.scaleSequential();

    // Initialize the scene.
    this.scene = new three.Scene();
    this.scene.background = null;

    // Initialize the camera.
    this.camera = new three.PerspectiveCamera(75, 1, 0.01, 10000);
    this.camera.position.x = 0;
    this.camera.position.y = 0;
    this.camera.position.z = 0;

    // Initialize the renderer.
    this.renderer = new three.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });

    // Initialize the controls.
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.01;
    this.controls.rotateSpeed = 0.15;
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableKeys = true;

    // Perform setup tasks.
    this.setupScales();
    this.setupCamera();
    this.setupElements();
  }

  /** Initializes the scales used to transform data for the scatter plot. */
  private setupScales() {
    // Find the range of values.
    const extentColor = d3.extent(this._data.data, (d) => d.value);

    this.scaleColor = findColormap(this._data.colormap);
    if (extentColor[0] !== undefined && extentColor[1] !== undefined)
      this.scaleColor.domain(extentColor);
  }
  /** Initializes the camera aspect ratio and size. */
  private setupCamera() {
    const { size } = createSvg(undefined, this.layout);
    this.renderer.setSize(size.width, size.height);
    this.camera.aspect = size.width / size.height;
  }
  /** Initializes the elements for the scatter plot. */
  private setupElements() {
    if (this.container) {
      // Attach the renderer to the container.
      const { style } = createSvg(undefined, this.layout);
      this.container.appendChild(this.renderer.domElement);
      this.renderer.domElement.setAttribute("style", style);
    }
  }

  // #region Zooming
  /** Zooms the plot to fit all of the data within the viewbox. */
  public zoomToFit() {
    const extentX = d3.extent(this._data.data, (d) => d.x);
    const extentY = d3.extent(this._data.data, (d) => d.y);
    const extentZ = d3.extent(this._data.data, (d) => d.z);

    if (extentX[0] === undefined || extentX[1] === undefined) return;
    if (extentY[0] === undefined || extentY[1] === undefined) return;
    if (extentZ[0] === undefined || extentZ[1] === undefined) return;

    const padding = 0.25;
    this.controls.target.set(
      (extentX[0] + extentX[1]) / 2,
      (extentY[0] + extentY[1]) / 2,
      (extentZ[0] + extentZ[1]) / 2
    );
    this.camera.lookAt(
      (extentX[0] + extentX[1]) / 2,
      (extentY[0] + extentY[1]) / 2,
      (extentZ[0] + extentZ[1]) / 2
    );
    this.camera.position.x = (extentX[0] + extentX[1]) / 2;
    this.camera.position.y = (extentY[0] + extentY[1]) / 2;
    this.camera.position.z = extentZ[0] - (extentZ[1] - extentZ[0]) * padding;
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
  public get layout(): IScatterPlotLayout {
    return { ...this._layout };
  }
  public set layout(value: IScatterPlotLayout) {
    this._layout = value;
    this.setupScales();
    this.setupCamera();
  }
  public get data(): IScatterPlotData<IScatterPoint3d> {
    return { ...this._data };
  }
  public set data(value: IScatterPlotData<IScatterPoint3d>) {
    this._data = value;
    this.setupScales();
  }
  //#endregion

  /** Renders a plot of the graph. */
  public render() {
    // Check if there are any new points to render.
    for (let k = 0; k < this._data.data.length; k++) {
      const point = this._data.data[k];
      if (!this.mapping.has(point.id)) {
        // Construct the new mesh.
        const material = new three.MeshLambertMaterial({
          color:
            point.value === undefined
              ? point.style?.fillColor ?? 0xffffff
              : this.scaleColor(point.value),
        });
        const geometry = new three.DodecahedronGeometry(point.radius, 1);
        const mesh = new three.Mesh(geometry, material);

        // Add the mesh to the scene.
        geometry.translate(point.x, point.y, point.z);
        this.mapping.set(point.id, [point, mesh]);
        this.scene.add(mesh);
      }
    }

    // Check if there are any old points to remove.
    const ids = this._data.data.map((d) => d.id);
    for (const [id, [, mesh]] of Array.from(this.mapping.entries())) {
      if (!ids.includes(id)) {
        this.scene.remove(mesh);
        this.mapping.delete(id);
      }
    }

    // Check if there are any existing points to update.
    for (let k = 0; k < this._data.data.length; k++) {
      const point = this._data.data[k];
      const exist = this.mapping.get(point.id);
      if (!exist) continue;
      const [existPoint, existMesh] = exist;

      // If anything has changed, simply re-create the mesh.
      if (point !== existPoint) {
        const material = new three.MeshLambertMaterial({
          color:
            point.value === undefined
              ? point.style?.fillColor ?? 0xffffff
              : this.scaleColor(point.value),
        });
        const geometry = new three.DodecahedronGeometry(point.radius, 1);
        const mesh = new three.Mesh(geometry, material);

        // Replace the mesh in the scene.
        geometry.translate(point.x, point.y, point.z);
        this.scene.remove(existMesh);
        this.scene.add(mesh);
        this.mapping.set(point.id, [point, mesh]);
      }
    }
  }
}

export { ScatterPlot2d, ScatterPlot3d };
export type {
  IScatterPoint,
  IScatterPoint2d,
  IScatterPoint3d,
  IScatterPlotData,
  IScatterPlotLayout,
  IScatterPlotEvents,
};
