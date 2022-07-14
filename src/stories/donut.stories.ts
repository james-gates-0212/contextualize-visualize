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
  layout: IDonutPlotLayout;
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

const data = [{
  label: "<5",
  value: 19912018
}, {
  label: "5-9",
  value: 20501982
}, {
  label: "10-14",
  value: 20679786
}, {
  label: "15-19",
  value: 21354481
}, {
  label: "20-24",
  value: 22604232
}, {
  label: "25-29",
  value: 21698010
}, {
  label: "30-34",
  value: 21183639
}, {
  label: "35-39",
  value: 19855782
}, {
  label: "40-44",
  value: 20796128
}, {
  label: "45-49",
  value: 21370368
}, {
  label: "50-54",
  value: 22525490
}, {
  label: "55-59",
  value: 21001947
},];

export const SimpleDonut = Template.bind({});
SimpleDonut.args = {
  data: {
    data: data,
  },
  layout: {
    label: "Population by age",
    percent: false,
  },
};
