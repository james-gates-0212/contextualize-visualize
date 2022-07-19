import { Story, Meta } from "@storybook/html";
import {
  IHeatmapCell,
  IHeatmapPlotData,
  IHeatmapPlotLayout,
  HeatmapPlot,
} from "plots";

interface IHeatmapPlot {
  /** The data to supply the Heatmap plot. */
  data?: IHeatmapPlotData<IHeatmapCell>;
  /** The layout to use for the Heatmap plot. */
  layout?: IHeatmapPlotLayout;
}

export default {
  title: "Plots/Heatmap",
} as Meta<IHeatmapPlot>;

const Template: Story<IHeatmapPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Heatmap plot.
  const { data, layout } = args;

  const plot = new HeatmapPlot(data, layout, container);
  plot
    .on("singleClickCell", (bin) => {
      bin.selected = !bin.selected;
      plot.render();
    })
    .on("clickSpace", () => {
      plot.data.data.forEach((col) => col.forEach((c) => (c.selected = false)));
      plot.render();
    });
  plot.render();

  return container;
};

let data: IHeatmapCell[][] = [];

for (let x = 0; x < 8; x++) {
  data[x] = [];
  for (let y = 0; y < 8; y++) {
    data[x][y] = {
      id: `${x}-${y}`,
      value: (x + y) % 2,
      label: "",
    };
  }
}

export const ChessBoardHeatmap = Template.bind({});
ChessBoardHeatmap.args = {
  data: {
    data: data,
  },
  layout: {
    axes: {
      x: {
        label: "Chess Board",
      },
    },
    groups: {
      x: {
        labels: ["A", "B", "C", "D", "E", "F", "G", "H"],
      },
      y: {
        labels: ["1", "2", "3", "4", "5", "6", "7", "8"],
      },
    },
  },
};

let interval: NodeJS.Timer | undefined = undefined;

const countries = [
  "Argentina",
  "Australia",
  "Austria",
  "Brazil",
  "Denmark",
  "England",
  "France",
  "Germany",
  "Italy",
  "Mexico",
  "Netherland",
  "Norway",
  "Portugal",
  "Spain",
];

const bitcoins = [
  "BTC",
  "ETH",
  "USDT",
  "USDC",
  "BNB",
  "BUSD",
  "XRP",
  "ADA",
  "SOL",
  "DOGE",
  "DOT",
  "MATIC",
  "AVAX",
  "SHIB",
  "TRX",
  "UNI",
  "WBTC",
];

const RealtimeTemplate: Story<IHeatmapPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Donut plot.
  const { layout } = args;

  const data: IHeatmapPlotData = {
    data: bitcoins.map((bitcoin, x) =>
      countries.map((country, y) => ({
        id: `${bitcoin}-${country}`,
        value: 0,
      }))
    ),
    colormap: "greens",
  };
  const plot = new HeatmapPlot(data, layout, container);
  plot
    .on("singleClickCell", (bin) => {
      bin.selected = !bin.selected;
      plot.render();
    })
    .on("clickSpace", () => {
      plot.data.data.forEach((col) => col.forEach((c) => (c.selected = false)));
      plot.render();
    });
  plot.render();

  let values: number[][];
  values = Array(bitcoins.length).fill(
    Array(countries.length)
      .fill(0)
      .map((_, k) => 1 + Math.sin(k / 5))
  );
  let valuesSum = values.reduce(
    (x, y) => x + y.reduce((y0, y1) => y0 + y1, 0),
    0
  );
  values = values.map((x) => x.map((y) => (y /= valuesSum)));

  if (interval) {
    clearInterval(interval);
    interval = undefined;
  }

  const xIndex = (i: number) => Math.floor(i / countries.length);
  const yIndex = (i: number) => i % countries.length;

  interval = setInterval(() => {
    let rand = Math.random();
    let index = 0;
    while (rand > values[xIndex(index)][yIndex(index)]) {
      index++;
      rand -= values[xIndex(index)][yIndex(index)];
    }
    if (data.data[xIndex(index)][yIndex(index)]) {
      data.data[xIndex(index)][yIndex(index)].value++;
    }

    plot.data = data;
    plot.render();
  }, 50);

  return container;
};

export const RealtimeHeatmap = RealtimeTemplate.bind({});
RealtimeHeatmap.args = {
  layout: {
    axes: {
      x: {
        label: "Bitcoin Depositing",
      },
    },
    groups: {
      x: {
        labels: bitcoins,
      },
      y: {
        labels: countries,
      },
    },
  },
};
