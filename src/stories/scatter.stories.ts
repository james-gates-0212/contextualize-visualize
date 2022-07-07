import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  ScatterPlot2d,
  IScatterPoint2d,
  IScatterPlotData,
  IScatterPlotLayout,
} from "plots";

interface IScatterPlot {
  /** The data to supply the scatter plot. */
  data?: IScatterPlotData<IScatterPoint2d>;
  /** The layout to use for the scatter plot. */
  layout: IScatterPlotLayout;
}

export default {
  title: "Plots/Scatter",
} as Meta<IScatterPlot>;

const Template: Story<IScatterPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the scatter plot.
  const { data, layout } = args;

  const plot = new ScatterPlot2d(data, layout, container);

  plot.render();

  return container;
};

export const SimpleScatter = Template.bind({});
SimpleScatter.args = {
  data: {
    data: [
      { id: "0", x: -3, y: 9 },
      { id: "1", x: -2, y: 4 },
      { id: "2", x: -1, y: 1 },
      { id: "3", x: 0, y: 0 },
      { id: "4", x: +1, y: 1 },
      { id: "5", x: +2, y: 4 },
      { id: "6", x: +3, y: 9 },
    ],
  },
  layout: {
    axes: {
      x: {
        label: "Simple Scatter-X"
      },
      y: {
        label: "Simple Scatter-Y"
      }
    }
  },
};

export const RandomScatter = Template.bind({});
let data: IScatterPoint2d[] = [];
for (let k = 0; k < 500; k++) {
  data.push({
    id: `${k}`,
    x: Math.random(),
    y: Math.random(),
  });
}
RandomScatter.args = {
  data: {
    data,
  },
  layout: {
    axes: {
      x: {
        label: "Random Scatter-X",
        showLines: true
      },
      y: {
        label: "Random Scatter-Y",
        showLines: true
      }
    }
  },
};

export const ColormapScatter = Template.bind({});
data = [];
for (let k = 0; k < 500; k++) {
  data.push({
    id: `${k}`,
    x: Math.random(),
    y: Math.random(),
    value: Math.random(),
  });
}
ColormapScatter.args = {
  data: {
    data,
    colormap: "inferno",
  },
  layout: {
    axes: {
      x: {
        label: "Colormap Scatter-X",
        showLines: true
      },
      y: {
        label: "Colormap Scatter-Y"
      }
    }
  },
};

export const DifferentRadiiScatter = Template.bind({});
data = [];
for (let k = 0; k < 500; k++) {
  const u1 = Math.random();
  const u2 = Math.random();
  const x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  const y = Math.sqrt(-2 * Math.log(u1)) * Math.sin(2 * Math.PI * u2);
  data.push({
    id: `${k}`,
    x,
    y,
    radius: Math.random() * 15,
    style: { fillColor: "rgba(0,180,255,0.35)" },
  });
}
DifferentRadiiScatter.args = {
  data: {
    data,
    colormap: "inferno",
  },
  layout: {
    axes: {
      x: {
        label: "Different Radi Scatter-X"
      },
      y: {
        label: "Different Radi Scatter-Y"
      }
    }
  },
};
