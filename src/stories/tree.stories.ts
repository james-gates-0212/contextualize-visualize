import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  TreePlot,
  ITreePlotData,
  ITreePlotLayout,
  ETreeTypes,
} from "plots";
import "./plots.css";

interface ITreePlot {
  /** The data to supply to the graph plot. */
  data?: ITreePlotData;
  /** The layout to use for the graph plot. */
  layout?: ITreePlotLayout;
  /** The view type for the graph plot. */
  type: ETreeTypes;
}

export default {
  title: "Plots/Tree",
  type: ETreeTypes.Vertical,
} as Meta<ITreePlot>;

const Template: Story<ITreePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the graph plot.
  const { data, layout, type } = args;
  const plot = new TreePlot(data, layout, container, type);
  plot.render();

  return container;
};

const treeSampleData = {
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
};

export const HorizontalTree = Template.bind({});
HorizontalTree.args = {
  data: treeSampleData,
  type: ETreeTypes.Horizontal,
};

export const VerticalTree = Template.bind({});
VerticalTree.args = {
  data: treeSampleData,
};
