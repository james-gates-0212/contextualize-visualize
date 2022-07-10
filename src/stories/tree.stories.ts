import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  TreePlot,
  ITreePlotData,
  ITreePlotLayout,
  TTreeLayout,
} from "plots";
import "./plots.css";

interface ITreePlot {
  /** The data to supply to the graph plot. */
  data?: ITreePlotData;
  /** The layout to use for the graph plot. */
  layout?: ITreePlotLayout;
  /** The layout to use for the hierarchy tree plot. */
  treeLayout?: TTreeLayout;
}

export default {
  title: "Plots/Tree",
  argTypes: {
    treeLayout: {
      options: [
        "none",
        "horizontal",
        "vertical",
        "radial/circular",
      ],
      control: {
        type: "radio",
      },
    },
  },
} as Meta<ITreePlot>;

const Template: Story<ITreePlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the graph plot.
  const { data, layout, treeLayout } = args;
  const plot = new TreePlot(data, layout, container, treeLayout);
  plot.render();

  return container;
};

// #region Sample Data for Tree
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
                    {
                      label: "Level 5",
                    },
                    {
                      label: "Level 5",
                    },
                    {
                      label: "Level 5",
                    },
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
            {
              label: "Level 3",
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
                    {
                      label: "Level 5",
                    },
                    {
                      label: "Level 5",
                    },
                    {
                      label: "Level 5",
                    },
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
            {
              label: "Level 3",
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
// #endregion

export const HierarchyTree = Template.bind({});
HierarchyTree.args = {
  data: treeSampleData,
};
