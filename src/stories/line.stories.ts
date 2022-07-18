import { Story, Meta } from "@storybook/html";
import { LinePlot, ILinePoint, ILinePlotData, ILinePlotLayout } from "plots";

interface ILinePlot {
  /** The data to supply the line plot. */
  data?: ILinePlotData | ILinePlotData[];
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

let data: ILinePoint[] = [];

export const SimpleLine = Template.bind({});
for (let i = -100; i <= 100; i += 2) {
  data.push({
    id: i.toString(),
    x: i / 100,
    y: (i / 100) ** 2,
    style: {
      fillRadius: i === 0 ? 2 : 1,
    },
  });
}
SimpleLine.args = {
  data: {
    id: "test",
    data,
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

export const DifferentColorLine = Template.bind({});
data = [];
for (let k = 0; k < Math.PI * 8; k += 0.1) {
  data.push({
    id: `${k}`,
    x: k,
    y: Math.sin(k) + 0.1 * Math.random(),
    value: Math.random(),
    style: {
      fillRadius: 1,
    },
  });
}
DifferentColorLine.args = {
  data: {
    id: "test",
    data,
    colormap: "rainbow",
  },
  layout: {
    axes: {
      x: {
        label: "Different Color Line",
      },
    },
  },
};

export const DashLine = Template.bind({});
data = [];
for (let k = 0, show = true; k < Math.PI * 4; k += 0.05, show = !show) {
  data.push({
    id: `${k}`,
    x: k,
    y: Math.sin(k / 2),
    style: {
      strokeColor: show ? "black" : "white",
    },
  });
}
DashLine.args = {
  data: {
    id: "test",
    data,
    colormap: "rainbow",
  },
  layout: {
    axes: {
      x: {
        label: "Different Color Line",
      },
    },
  },
};

export const SpirographLine = Template.bind({});
data = [];
for (let t = 0; t <= 1; t += 0.001) {
  data.push({
    id: `${t}`,
    x: 8 * Math.cos(2 * Math.PI * t) + 4 * Math.cos(16 * Math.PI * t),
    y: 8 * Math.sin(2 * Math.PI * t) - 4 * Math.sin(16 * Math.PI * t),
    value: t,
  });
}
data.push({
  id: `00`,
  x: 8 * Math.cos(2 * Math.PI * 0) + 4 * Math.cos(16 * Math.PI * 0),
  y: 8 * Math.sin(2 * Math.PI * 0) - 4 * Math.sin(16 * Math.PI * 0),
  value: 0,
});
SpirographLine.args = {
  data: {
    id: "test",
    data,
    colormap: "rainbow",
  },
  layout: {
    axes: {
      x: {
        label: "Spirograph",
      },
    },
  },
};

export const MultiLines = Template.bind({});
let multiData: ILinePlotData[] = [];
data = [];
for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
  data.push({
    id: `${t}`,
    x: t,
    y: Math.sin(t),
  });
}
multiData.push({
  id: "sin",
  label: "sin",
  data: data,
  color: "red",
});
data = [];
for (let t = 0; t <= 2 * Math.PI; t += 0.1) {
  data.push({
    id: `${t}`,
    x: t,
    y: Math.cos(t),
  });
}
multiData.push({
  id: "cos",
  label: "cos",
  data: data,
  color: "blue",
});
MultiLines.args = {
  data: multiData,
  layout: {
    axes: {
      x: {
        label: "Multi Lines",
      },
    },
  },
};

let interval: NodeJS.Timer | undefined = undefined;

const RealtimeTemplate: Story<ILinePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the line plot.
  const dataGermany: ILinePlotData<ILinePoint> = {
    id: "Germany",
    data: [{ id: "0", x: 0, y: 0 }],
    color: "blue",
  };
  const dataFrance: ILinePlotData<ILinePoint> = {
    id: "France",
    data: [{ id: "0", x: 0, y: 0 }],
    color: "green",
  };
  const { layout } = args;
  const plot = new LinePlot([dataGermany, dataFrance], layout, container);

  plot.render();
  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }
  const limitPoints = 500;
  const addNewPoint = (data: ILinePlotData) => {
    const length = data.data.length;
    const datum = data.data[length - 1];
    const u1 = Math.random();
    const u2 = Math.random();
    const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const x = datum.x! + 1;
    const y = datum.y! + n;
    if (data.data.length >= limitPoints) {
      data.data.shift();
    }
    data.data.push({ id: `${length}`, x, y });
  };
  interval = setInterval(() => {
    addNewPoint(dataGermany);
    addNewPoint(dataFrance);
    plot.data = [dataGermany, dataFrance];
    plot.render();
  }, 50);

  return container;
};

export const RealtimeLine = RealtimeTemplate.bind({});
RealtimeLine.args = {
  layout: {
    axes: {
      x: { label: "Time (in days)" },
      y: { label: "Relative Market Value ($/share)", showLines: true },
    },
  },
};

const MarketTemplate: Story<ILinePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the line plot.
  const data: ILinePlotData<ILinePoint> = {
    id: "test",
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
  const limitPoints = 500;
  interval = setInterval(() => {
    const length = data.data.length;
    const datum = data.data[length - 1];
    const u1 = Math.random();
    const u2 = Math.random();
    const n = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    const x = datum.x! + 1;
    const y = datum.y! + n;
    if (data.data.length >= limitPoints) {
      data.data.shift();
    }
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
