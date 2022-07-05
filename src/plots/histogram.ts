import * as d3 from "d3";

// Histogram Plot characteristics
/*
  - Can possibly be vertical or horizontal.
  - A single sequence of data that is grouped into a fixed number of bins.
  - Two can be combined with a 2D scatter to get a histogram per dimension.
*/

type AxisName = "x" | "y";

interface IPlot<TData> {
  data: TData;

  size?: {
    width: number;
    height: number;
  };

  margin?: {
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
  };

  axes?: Partial<
    Record<
      AxisName,
      {
        label?: string;
        minimum?: number;
        maximum?: number;
      }
    >
  >;

  color?: string;
  colormap?: string;
}

type IHistogramData = {
  frequency: number;
  min: number;
  max: number;
}[];

const HistogramPlot = (container: HTMLElement, plot: IPlot<IHistogramData>) => {
  const width = plot.size?.width ?? 800;
  const height = plot.size?.height ?? 640;

  const margin = {
    left: 60,
    right: 20,
    top: 20,
    bottom: 40,
    ...plot.margin,
  };

  const svgElement = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`);

  if (!plot.data) return;

  const rangePoints = [];
  for (let k = 0; k < plot.data.length; k++) {
    rangePoints.push(plot.data[k].min);
    rangePoints.push(plot.data[k].max);
  }
  const extentValues = d3.extent(rangePoints);
  const scaleValues = d3
    .scaleLinear()
    .domain([
      plot.axes?.x?.minimum ?? extentValues[0] ?? 0,
      plot.axes?.x?.maximum ?? extentValues[1] ?? 0,
    ])
    .range([margin.left, width - margin.right]);

  const extentFreq = d3.extent(plot.data, (value) => value.frequency);
  const scaleFreq = d3
    .scaleLinear()
    .domain([
      plot.axes?.y?.maximum ?? extentFreq[0] ?? 0,
      plot.axes?.y?.maximum ?? extentFreq[1] ?? 0,
    ])
    .range([height - margin.bottom, margin.top]);

  svgElement
    .append("g")
    .attr("transform", `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(scaleValues));
  svgElement
    .append("g")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(scaleFreq));

  svgElement
    .append("g")
    .selectAll("rect")
    .data(plot.data)
    .join("rect")
    // TODO: Abstract spacing.
    .attr("x", (d) => scaleValues(d.min) + 1)
    .attr("width", (d) => Math.max(0, scaleValues(d.max) - scaleValues(d.min) - 1))
    .attr("y", (d) => scaleFreq(d.frequency))
    .attr("height", (d) => scaleFreq(0) - scaleFreq(d.frequency))
    .attr("fill", plot.color ?? "#000");
};

export default HistogramPlot;