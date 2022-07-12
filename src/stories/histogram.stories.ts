import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  IHistogramBin,
  IHistogramPlotData,
  IHistogramPlotLayout,
  HistogramPlot,
} from "plots";

interface IHistogramPlot {
  /** The data to supply the Histogram plot. */
  data?: IHistogramPlotData<IHistogramBin>;
  /** The layout to use for the Histogram plot. */
  layout: IHistogramPlotLayout;
}

export default {
  title: "Plots/Histogram",
} as Meta<IHistogramPlot>;

const Template: Story<IHistogramPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Histogram plot.
  const { data, layout } = args;

  const plot = new HistogramPlot(data, layout, container);

  plot.render();

  return container;
};

let data: IHistogramBin[] = [];
let prevPos: number = 0;
for (let i = 0; i < 10; i++) {
  const d = Math.round(Math.random() ** 2 * 111);
  data.push({
    frequency: Math.random() * 10,
    min: prevPos,
    max: prevPos + d,
    style: {
      fillColor: `rgba(0,180,255,.5)`,
      fillRadius: Math.random() * 5,
      strokeColor: `rgba(0,90,180,1)`,
      strokeWidth: 1,
    },
  });
  prevPos += d;
}

export const HorizontalHistogram = Template.bind({});
HorizontalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    axes: {
      x: {
        label: "Horizontal Histogram",
      },
      y: {
        showLines: true,
      }
    },
  },
};

export const VerticalHistogram = Template.bind({});
VerticalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    axes: {
      x: {
        showLines: true,
      },
      y: {
        label: "Vertical Histogram",
      }
    },
  },
};
