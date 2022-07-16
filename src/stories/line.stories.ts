import { Story, Meta } from "@storybook/html";
import { LinePlot, ILinePoint, ILinePlotData, ILinePlotLayout } from "plots";

interface ILinePlot {
  /** The data to supply the line plot. */
  data?: ILinePlotData<ILinePoint>;
  /** The layout to use for the line plot. */
  layout: ILinePlotLayout;
}

export default {
  title: "Plots/Line",
} as Meta<ILinePlot>;

const Template: Story<ILinePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the line plot.
  const { data, layout } = args;

  const plot = new LinePlot(data, layout, container);

  plot.render();

  return container;
};

export const SimpleLine = Template.bind({});
SimpleLine.args = {
  data: {
    data: [
      {
        id: "0",
        x: -3,
        y: 9,
        style: {
          fillColor: "red",
          fillRadius: 15,
          strokeColor: "yellow",
          strokeWidth: 3,
        },
      },
      { id: "1", x: -2, y: 4 },
      {
        id: "2",
        x: -1,
        y: 1,
        style: {
          fillColor: "blue",
          fillRadius: 12,
          strokeColor: "brown",
          strokeWidth: 7,
        },
      },
      { id: "3", x: 0, y: 0 },
      {
        id: "4",
        x: +1,
        y: 1,
        style: {
          fillColor: "black",
          fillRadius: 8,
          strokeColor: "purple",
          strokeWidth: 3,
        },
      },
      { id: "5", x: +2, y: 4 },
      {
        id: "6",
        x: +3,
        y: 9,
        style: {
          fillColor: "yellow",
          fillRadius: 10,
          strokeColor: "cyan",
          strokeWidth: 4,
        },
      },
    ],
  },
  layout: {
    axes: {
      x: {
        label: "Simple Line-X",
      },
      y: {
        label: "Simple Line-Y",
      },
    },
  },
};

export const RandomLine = Template.bind({});
let data: ILinePoint[] = [];
for (let k = 0; k < 500; k++) {
  data.push({
    id: `${k}`,
    x: Math.random(),
    y: Math.random(),
  });
}
RandomLine.args = {
  data: {
    data,
  },
  layout: {
    axes: {
      x: {
        label: "Random Line-X",
        showLines: true,
      },
      y: {
        label: "Random Line-Y",
        showLines: true,
      },
    },
  },
};

export const ColormapLine = Template.bind({});
data = [];
for (let k = 0; k < 100; k++) {
  data.push({
    id: `${k}`,
    x: Math.random(),
    y: Math.random(),
    value: Math.random(),
    weight: Math.random(),
    style: {
      fillRadius: Math.round(10 * Math.random()),
      strokeWidth: Math.round(5 * Math.random()),
    },
  });
}
ColormapLine.args = {
  data: {
    data,
    colormap: "inferno",
  },
  layout: {
    axes: {
      x: {
        label: "Colormap Line-X",
        showLines: true,
      },
      y: {
        label: "Colormap Line-Y",
      },
    },
  },
};

let interval: NodeJS.Timer | undefined = undefined;
const MarketTemplate: Story<ILinePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the line plot.
  const data: ILinePlotData<ILinePoint> = {
    data: [{ id: "0", x: 0, y: 0, value: 0 }],
    colormap: "RdYlGn",
  };
  const { layout } = args;
  const plot = new LinePlot(data, layout, container);

  plot.render();
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }
  interval = setInterval(() => {
    const length = data.data.length;
    const datum = data.data[length - 1];
    const u1 = Math.random();
    const u2 = Math.random();
    const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const x = datum.x! + 1;
    const y = datum.y! + n;
    data.data.push({ id: `${length}`, x, y, value: y });

    plot.data = data;
    plot.render();
  }, 50);

  return container;
};

export const StockMarketLine = MarketTemplate.bind({});
StockMarketLine.args = {
  layout: {
    axes: {
      x: { label: "Time (in days)" },
      y: { label: "Relative Market Value ($/share)", showLines: true },
    },
  },
};
