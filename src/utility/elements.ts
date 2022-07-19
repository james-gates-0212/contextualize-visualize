import * as d3 from "d3";
import { IPlotLayout } from "types";

function createSvg<TPlot extends IPlotLayout<string>>(
  container: HTMLElement,
  plot: TPlot,
  centered?: boolean
): {
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, undefined>;
  size: { width: number; height: number };
  margin: { top: number; right: number; bottom: number; left: number };
  viewBox: string;
  style: string;
};
function createSvg<TPlot extends IPlotLayout<string>>(
  container: undefined,
  plot: TPlot,
  centered?: boolean
): {
  svg: undefined;
  size: { width: number; height: number };
  margin: { top: number; right: number; bottom: number; left: number };
  viewBox: string;
  style: string;
};

/**
 * Creates an SVG element and attaches it to the specified container based on plot data.
 * @param container The container to attach the plot to.
 * @param plot The data of the plot to generate.
 * @param centered Whether the viewport of the plot should be centered on the data.
 * @returns The SVG element that was created.
 */
function createSvg<TPlot extends IPlotLayout<string>>(
  container: HTMLElement | undefined,
  plot: TPlot,
  centered?: boolean
) {
  // We define some default values for the SVG element.
  const defaultSize = { width: 800, height: 600 };
  const defaultMargin = { top: 20, right: 20, bottom: 40, left: 60 };

  // We find the size and style of the container.
  const size = { ...defaultSize, ...plot.size };
  const margin = { ...defaultMargin, ...plot.margin };
  const style = plot.style
    ? Object.entries(plot.style)
        .map(([key, value]) => `${key}: ${value};`)
        .join(" ")
    : "";

  // Construct the SVG element.
  const viewBox = centered
    ? `${-size.width / 2} ${-size.height / 2} ${size.width} ${size.height}`
    : `0 0 ${size.width} ${size.height}`;
  if (container) {
    const svg = d3
      .select(container)
      .append("svg")
      .attr("viewBox", viewBox)
      .attr("style", style);

    // Return the SVG element and relevant computed information.
    return { size, margin, style, viewBox, svg } as any;
  } else {
    // Return the SVG element and relevant computed information.
    return { size, margin, style, viewBox } as any;
  }
}

export { createSvg };
