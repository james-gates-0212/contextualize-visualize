import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  TreePlot,
  ITreePlotData,
  ITreePlotLayout,
} from "plots";
import "./plots.css";

interface ITreePlot {
  /** The data to supply to the graph plot. */
  data?: ITreePlotData;
  /** The layout to use for the graph plot. */
  layout?: ITreePlotLayout;
}

export default {
  title: "Plots/Tree",
  argTypes: {
  },
} as Meta<ITreePlot>;

const Template: Story<ITreePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the graph plot.
  const { data, layout } = args;
  const plot = new TreePlot(data, layout, container);
  plot.render();

  return container;
};

export const Vertical = Template.bind({});
Vertical.args = {
  data: {
    label: "Root",
    children: [
      {
        label: "Level 1",
        children: [
          {
            label: "Level 2",
            children: [
              {
                label: "Level 3",
                children: [
                  {
                    label: "Level 4",
                    children: [
                      {
                        label: "Level 5",
                      },
                    ],
                  },
                ],
              },
              {
                label: "Level 3",
              },
            ],
          },
        ],
      },
      {
        label: "Level 1",
        children: [
          {
            label: "Level 2",
            children: [
              {
                label: "Level 3",
                children: [
                  {
                    label: "Level 4",
                    children: [
                      {
                        label: "Level 5",
                      },
                    ],
                  },
                ],
              },
              {
                label: "Level 3",
              },
            ],
          },
        ],
      },
    ],
  },
};
