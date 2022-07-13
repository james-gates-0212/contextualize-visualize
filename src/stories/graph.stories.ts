import * as d3 from "d3";
import { Story, Meta } from "@storybook/html";
import {
  GraphPlot,
  IGraphEdge,
  IGraphPlotData,
  IGraphPlotLayout,
  IGraphVertex,
  TTreeLayout,
} from "plots";
import "./plots.css";
import { Timer } from "d3";

interface IGraphPlot {
  /** The data to supply to the graph plot. */
  data?: IGraphPlotData;
  /** The layout to use for the graph plot. */
  layout?: IGraphPlotLayout;

  /** The strength of the node force. */
  forceNode?: number;
  /** The strength of the link force. */
  forceLink?: number;
  /** The strength of the centering force. */
  forceCenter?: number;

  /** The layout to use for the hierarchy tree plot. */
  treeLayout?: TTreeLayout;
}

export default {
  title: "Plots/Graph",
  argTypes: {
    forceNode: {
      control: {
        type: "range",
        min: 0,
        max: 2000,
        step: 10,
      },
    },
    forceLink: {
      control: { type: "range", min: 0, max: 1.0, step: 0.01 },
    },
    forceCenter: {
      control: { type: "range", min: 0, max: 1.0, step: 0.01 },
    },
    treeLayout: {
      options: ["none", "horizontal", "vertical", "radial"],
      control: {
        type: "radio",
      },
    },
  },
} as Meta<IGraphPlot>;

const Template: Story<IGraphPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the graph plot.
  const { data, layout, forceNode, forceLink, forceCenter, treeLayout } = args;
  const plot = new GraphPlot(data, layout, container);
  if (forceNode) plot.forceNode = d3.forceManyBody().strength(-forceNode);
  if (forceLink) {
    plot.forceLink = d3
      .forceLink<IGraphVertex, IGraphEdge>()
      .id(({ id }) => id)
      .strength(forceLink);
  }
  if (forceCenter) {
    plot.forceX = d3.forceX(0).strength(forceCenter);
    plot.forceY = d3.forceY(0).strength(forceCenter);
  }
  if (treeLayout) {
    plot.treeLayout = treeLayout;
  }
  plot.render();

  return container;
};

export const SingleNode = Template.bind({});
SingleNode.args = {
  data: {
    vertices: [
      {
        id: "Node",
        label: "Node",
        style: { fillColor: "red", strokeColor: "rgba(0,0,0,0.25)" },
      },
    ],
    edges: [],
  },
  treeLayout: "none",
};

export const MultipleNodes = Template.bind({});
MultipleNodes.args = {
  data: {
    vertices: [
      { id: "A", label: "A" },
      { id: "B", label: "B" },
      { id: "C", label: "C" },
    ],
    edges: [
      { source: "A", target: "B", directed: false },
      { source: "B", target: "C", directed: false },
    ],
  },
  treeLayout: "none",
};

export const HierarchicalNodes = Template.bind({});
HierarchicalNodes.args = {
  data: {
    vertices: [
      { id: "1", label: "Grandparent" },
      { id: "1-1", label: "Parent 1" },
      { id: "1-2", label: "Parent 2" },
      { id: "1-3", label: "Parent 3" },
      { id: "1-1-1", label: "Child 1" },
      { id: "1-1-2", label: "Child 2" },
      { id: "1-1-3", label: "Child 3" },
      { id: "1-3-1", label: "Child 1" },
      { id: "1-3-2", label: "Child 2" },
    ],
    edges: [
      { source: "1", target: "1-1", directed: true },
      { source: "1", target: "1-2", directed: true },
      { source: "1", target: "1-3", directed: true },
      { source: "1-1", target: "1-1-1", directed: true },
      { source: "1-1", target: "1-1-2", directed: true },
      { source: "1-1", target: "1-1-3", directed: true },
      { source: "1-2", target: "1-3-1", directed: true },
      { source: "1-2", target: "1-3-2", directed: true },
    ],
  },
  treeLayout: "none",
};

export const TwoHubsOfNodes = Template.bind({});
const vertices: IGraphVertex[] = [
  {
    id: "root1",
    label: "Root 1",
    style: { fillColor: "white", strokeColor: "black", fillRadius: 10 },
  },
  {
    id: "root2",
    label: "Root 2",
    style: { fillColor: "white", strokeColor: "black", fillRadius: 40 },
  },
];
const edges: IGraphEdge[] = [];
for (let k = 0; k < 25; k++) {
  vertices.push({
    id: `child1-${k}`,
    label: `Child ${k + 1}`,
    style: { fillColor: "blue", strokeColor: "rgba(0,0,0,0.2)", fillRadius: 5 },
  });
  edges.push({
    source: `root1`,
    target: `child1-${k}`,
    directed: true,
  });
}
for (let k = 0; k < 100; k++) {
  vertices.push({
    id: `child2-${k}`,
    label: `Child ${k + 1}`,
    style: { fillColor: "red", strokeColor: "rgba(0,0,0,0.2)", fillRadius: 5 },
  });
  edges.push({
    source: `root2`,
    target: `child2-${k}`,
    directed: true,
  });
}
TwoHubsOfNodes.args = {
  data: {
    vertices,
    edges,
  },
  treeLayout: "none",
};

let timeoutID: NodeJS.Timer;

const RealtimeTemplate: Story<IGraphPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the graph plot.
  const { layout, forceNode, forceLink, forceCenter, treeLayout } = args;
  const data: IGraphPlotData = { vertices: [], edges: [] };
  const plot = new GraphPlot(data, layout, container);
  if (forceNode) plot.forceNode = d3.forceManyBody().strength(-forceNode);
  if (forceLink) {
    plot.forceLink = d3
      .forceLink<IGraphVertex, IGraphEdge>()
      .id(({ id }) => id)
      .strength(forceLink);
  }
  if (forceCenter) {
    plot.forceX = d3.forceX(0).strength(forceCenter);
    plot.forceY = d3.forceY(0).strength(forceCenter);
  }
  if (treeLayout) {
    plot.treeLayout = treeLayout;
  }
  plot.render();

  if (timeoutID) {
    clearInterval(timeoutID);
  }

  timeoutID = setInterval(() => {
    const length = data.vertices.length;
    const index = Math.floor(length * Math.random());
    data.vertices.push({ id: length.toString(), label: length.toString() });
    if (length) {
      data.edges.push({
        source: index.toString(),
        target: length.toString(),
        directed: true,
      });
    }
    plot.data = data;
    plot.simulate();
    plot.render();
  }, 1000);

  return container;
};

export const RealtimeNodes = RealtimeTemplate.bind({});
RealtimeNodes.args = {
  treeLayout: "none",
};
