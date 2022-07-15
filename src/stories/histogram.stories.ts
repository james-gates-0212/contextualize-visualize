import { Story, Meta } from "@storybook/html";
import {
  IHistogramBin,
  IHistogramPlotData,
  IHistogramPlotLayout,
  HistogramPlot,
} from "plots";

interface IHistogramPlot {
  /** The data to supply the Histogram plot. */
  data?: IHistogramPlotData<IHistogramBin>;
  /** The layout to use for the Histogram plot. */
  layout?: IHistogramPlotLayout;
}

export default {
  title: "Plots/Histogram",
} as Meta<IHistogramPlot>;

const Template: Story<IHistogramPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Histogram plot.
  const { data, layout } = args;

  const plot = new HistogramPlot(data, layout, container);

  plot.render();

  return container;
};

let data: IHistogramBin[] = [];
for (let i = 0; i < 50; i++) {
  data.push({
    frequency: i ** 2,
    min: i / 2,
    max: i / 2 + 0.5,
    style: {
      // fillColor: `rgba(0,180,255,.5)`,
      // strokeColor: `rgba(0,90,180,1)`,
      // strokeWidth: 0,
    },
  });
}

export const HorizontalHistogram = Template.bind({});
HorizontalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "horizontal",
    axes: {
      x: {
        label: "Population by age",
      },
      y: {
        showLines: true,
      },
    },
  },
};

export const VerticalHistogram = Template.bind({});
VerticalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "vertical",
    axes: {
      x: {
        showLines: true,
      },
      y: {
        label: "Population by age",
      },
    },
  },
};

data = [{
  min: 0,
  max: 5,
  frequency: 19912018,
  style: {
    fillColor: "#ff0000",
    strokeColor: "#770000",
    strokeWidth: 1,
  },
}, {
  min: 5,
  max: 10,
  frequency: 20501982,
  style: {
    fillColor: "#ffff00",
    strokeColor: "#777700",
    strokeWidth: 2,
  },
}, {
  min: 10,
  max: 15,
  frequency: 20679786,
  style: {
    fillColor: "#00ff00",
    strokeColor: "#007700",
    strokeWidth: 3,
  },
}, {
  min: 15,
  max: 20,
  frequency: 21354481,
  style: {
    fillColor: "#00ffff",
    strokeColor: "#007777",
    strokeWidth: 4,
  },
}, {
  min: 20,
  max: 25,
  frequency: 22604232,
  style: {
    fillColor: "#0000ff",
    strokeColor: "#000077",
    strokeWidth: 5,
  },
}, {
  min: 25,
  max: 30,
  frequency: 21698010,
  style: {
    fillColor: "#ff00ff",
    strokeColor: "#770077",
    strokeWidth: 6,
  },
}, {
  min: 30,
  max: 35,
  frequency: 21183639,
  style: {
    fillColor: "#ff0000",
    strokeColor: "#770000",
    strokeWidth: 7,
  },
}, {
  min: 35,
  max: 40,
  frequency: 19855782,
  style: {
    fillColor: "#ffff00",
    strokeColor: "#777700",
    strokeWidth: 8,
  },
}, {
  min: 40,
  max: 45,
  frequency: 20796128,
  style: {
    fillColor: "#00ff00",
    strokeColor: "#007700",
    strokeWidth: 9,
  },
}, {
  min: 45,
  max: 50,
  frequency: 21370368,
  style: {
    fillColor: "#00ffff",
    strokeColor: "#007777",
    strokeWidth: 10,
  },
}, {
  min: 50,
  max: 55,
  frequency: 22525490,
  style: {
    fillColor: "#0000ff",
    strokeColor: "#000077",
    strokeWidth: 11,
  },
}, {
  min: 55,
  max: 60,
  frequency: 21001947,
  style: {
    fillColor: "#ff00ff",
    strokeColor: "#770077",
    strokeWidth: 12,
  },
},];

export const CustomHorizontalHistogram = Template.bind({});
CustomHorizontalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "horizontal",
    axes: {
      x: {
        label: "Population by age",
      },
      y: {
        showLines: true,
      },
    },
  },
};

export const CustomVerticalHistogram = Template.bind({});
CustomVerticalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "vertical",
    axes: {
      y: {
        label: "Population by age",
      },
      x: {
        showLines: true,
      },
    },
  },
};

data = [];
let prevPos: number = 0;
for (let i = 0; i < 10; i++) {
  const d = Math.round(Math.random() ** 2 * 111);
  data.push({
    frequency: Math.random() * 10,
    min: prevPos,
    max: prevPos + d,
    style: {
      fillColor: `rgba(0,180,255,.5)`,
      fillRadius: 5,
      strokeColor: `rgba(0,90,180,1)`,
      // strokeWidth: 2,
    },
  });
  prevPos += d;
}

export const RandomHorizontalHistogram = Template.bind({});
RandomHorizontalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "horizontal",
    axes: {
      y: {
        showLines: true,
      },
      x: {
        label: "Random Histogram",
      },
    },
  },
};

export const RandomVerticalHistogram = Template.bind({});
RandomVerticalHistogram.args = {
  data: {
    data: data,
  },
  layout: {
    orientation: "vertical",
    axes: {
      x: {
        showLines: true,
      },
      y: {
        label: "Random Histogram",
      },
    },
  },
};

let timeoutID: NodeJS.Timer;

const RealtimeTemplate: Story<IHistogramPlot> = (args) => {
  // Construct the container.
  let container: HTMLDivElement;
  container = document.createElement("div");
  container.className = "plot-container";

  // Set up the Histogram plot.
  const layout: IHistogramPlotLayout = {
    orientation: "horizontal",
    axes: {
      y: {
        showLines: true,
      },
    },
  };

  const data: IHistogramPlotData = {
    data: Array(20)
      .fill(null)
      .map((_, k) => ({
        frequency: 0,
        min: k,
        max: k + 1,
      })),
  };
  const plot = new HistogramPlot(data, layout, container);

  plot.render();

  let frequencies: number[];
  frequencies = Array(20)
    .fill(0)
    .map((_, k) => 1 + Math.sin(k / 5));
  let frequencySum = frequencies.reduce((x, y) => x + y, 0);
  frequencies = frequencies.map((f) => f / frequencySum);

  if (timeoutID) {
    clearInterval(timeoutID);
  }

  timeoutID = setInterval(() => {
    let rand = Math.random();
    let index = 0;
    while (rand > frequencies[index]) {
      index++;
      rand -= frequencies[index];
    }
    if (data.data[index]) {
      data.data[index].frequency++;
    }

    plot.data = data;
    plot.render();
  }, 50);

  return container;
};

export const RealtimeHistogram = RealtimeTemplate.bind({});
RealtimeTemplate.args = {};
