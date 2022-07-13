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
  layout?: IHistogramPlotLayout;
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
for (let i = 0; i < 50; i++) {
  data.push({
    frequency: i ** 2,
    min: i / 2,
    max: i / 2 + 0.5,
    style: {
      // fillColor: `rgba(0,180,255,.5)`,
      // strokeColor: `rgba(0,90,180,1)`,
      // strokeWidth: 0,
    },
  });
}

export const HorizontalHistogram = Template.bind({});
HorizontalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "horizontal",
    axes: {
      x: {
        label: "Horizontal Histogram",
      },
      y: {
        label: "Frequency",
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
    orientation: "vertical",
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
