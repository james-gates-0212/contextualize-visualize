import { Story, Meta } from "@storybook/html";
import {
  DonutPlot,
  IDonutBin,
  IDonutPlotData,
  IDonutPlotLayout,
} from "plots";

interface IDonutPlot {
  /** The data to supply the line plot. */
  data?: IDonutPlotData<IDonutBin>;
  /** The layout to use for the line plot. */
  layout?: IDonutPlotLayout;
}

export default {
  title: "Plots/Donut",
} as Meta<IDonutPlot>;

const Template: Story<IDonutPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the line plot.
  const { data, layout } = args;

  const plot = new DonutPlot(data, layout, container);

  plot.render();

  return container;
};

const data:IDonutBin[] = [{
  label: "<5",
  value: 19912018,
  style: {
    fillRadius: 40,
  },
}, {
  label: "5-9",
  value: 20501982,
  style: {
    fillRadius: 50,
  },
}, {
  label: "10-14",
  value: 20679786,
  style: {
    fillColor: "#dbdbdb",
    fillRadius: 60,
  },
}, {
  label: "15-19",
  value: 21354481,
}, {
  label: "20-24",
  value: 22604232,
}, {
  label: "25-29",
  value: 21698010,
}, {
  label: "30-34",
  value: 21183639,
}, {
  label: "35-39",
  value: 19855782,
}, {
  label: "40-44",
  value: 20796128,
}, {
  label: "45-49",
  value: 21370368,
}, {
  label: "50-54",
  value: 22525490,
}, {
  label: "55-59",
  value: 21001947,
},];

export const SimpleDonut = Template.bind({});
SimpleDonut.args = {
  data: {
    data: data,
    colormap: "inferno",
  },
  layout: {
    label: "Population by age",
    percent: false,
  },
};

export const PercentageDonut = Template.bind({});
PercentageDonut.args = {
  data: {
    data: data,
  },
  layout: {
    label: "Population by age",
    percent: true,
  },
};

export const GenderDonut = Template.bind({});
GenderDonut.args = {
  data: {
    data: [{
      label: "Male",
      value: 54687123,
      style: {
        fillColor: "blue",
      },
    },{
      label: "Female",
      value: 86471235,
      style: {
        fillColor: "pink",
      },
    },],
  },
  layout: {
    label: "Population by gender",
    percent: false,
  },
};

let timeoutID: NodeJS.Timer;

const RealtimeTemplate: Story<IDonutPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Donut plot.
  const layout: IDonutPlotLayout = {
    label: "Voting for a winner",
  };

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

  const data: IDonutPlotData = {
    data: countries.map(country => ({
        label: country,
        value: 0,
      })),
  };
  const plot = new DonutPlot(data, layout, container);

  plot.render();

  let values: number[];
  values = Array(countries.length)
    .fill(0)
    .map((_, k) => 1 + Math.sin(k / 5));
  let valuesSum = values.reduce((x, y) => x + y, 0);
  values = values.map((f) => f / valuesSum);

  if (timeoutID) {
    clearInterval(timeoutID);
  }

  timeoutID = setInterval(() => {
    let rand = Math.random();
    let index = 0;
    while (rand > values[index]) {
      index++;
      rand -= values[index];
    }
    if (data.data[index]) {
      data.data[index].value++;
    }

    plot.data = data;
    plot.render();
  }, 50);

  return container;
};

export const RealtimeDonut = RealtimeTemplate.bind({});
RealtimeDonut.args = {};
