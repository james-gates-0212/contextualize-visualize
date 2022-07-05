// Line Plot characteristcs
/*
  - Can draw multiple sets of independent data (with one label per set of data).
  - Perhaps allow for specifying both (x and y dimensions to allow for freeform plots.)
*/

import * as d3 from "d3";

// TODO: Support ordered and unordered domains. (For now, assume that the inputs are already ordered.)
// TODO: Support padding for axis ranges.
// TODO: Support different axis sides.
// TODO: Support axis labels.
// TODO: Time-style axes?
// TODO: Add labels (legend) for the lines.
// TODO: Support different colors.
// TODO: Support line width.

const LinePlot = (container: HTMLElement, data: any) => {
  // TODO: Abstract this section.
  const width = 800;
  const height = 640;

  const marginLeft = 60;
  const marginRight = 20;
  const marginTop = 20;
  const marginBottom = 40;

  // TODO: Abstract this section.
  const svg = d3
    .select(container)
    .append("svg")
    .attr("width", width + marginLeft + marginRight)
    .attr("height", height + marginTop + marginBottom)
    .append("g")
    .attr("transform", `translate(${marginLeft},${marginTop})`);

  // TODO: Make our data structures as compatible with these data structures as possible.
  const xValues = data.dims[0];
  const yValues = data.dims[1];
  const d: { x: number; y: number }[] = [];
  for (let k = 0; k < xValues.length; k++)
    d.push({ x: xValues[k], y: yValues[k] });

  const x = d3
    .scaleLinear()
    .domain([Math.min(...xValues), Math.max(...xValues)])
    .range([0, width]);
  const y = d3
    .scaleLinear()
    .domain([Math.min(...yValues), Math.max(...yValues)])
    .range([height, 0]);

  // TODO: Abstract this section.
  // TODO: Use d3.axis() and .orient("bottom"/"left")
  svg
    .append("g")
    .attr("transform", `translate(0, ${height})`)
    .call(d3.axisBottom(x));
  svg.append("g").call(d3.axisLeft(y));

  svg
    .append("path")
    .datum(d)
    .attr("fill", "none")
    .attr("stroke", "#1d7535")
    .attr("stroke-width", 2)
    .attr(
      "d",
      d3.line(
        (d) => x(d.x),
        (d) => y(d.y)
      )
    );
};

export default LinePlot;
