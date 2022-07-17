const sampleData = [
  {
    label: "flare_d3",
    children: [
      {
        label: "analytics",
        children: [
          {
            label: "cluster",
            children: [
              {
                label: "AgglomerativeCluster",
              },
              {
                label: "CommunityStructure",
              },
              {
                label: "HierarchicalCluster",
              },
              {
                label: "MergeEdge",
              },
            ],
          },
          {
            label: "graph",
            children: [
              {
                label: "BetweennessCentrality",
              },
              {
                label: "LinkDistance",
              },
              {
                label: "MaxFlowMinCut",
              },
              {
                label: "ShortestPaths",
              },
              {
                label: "SpanningTree",
              },
            ],
          },
          {
            label: "optimization",
            children: [
              {
                label: "AspectRatioBanker",
              },
            ],
          },
        ],
      },
      {
        label: "animate",
        children: [
          {
            label: "Easing",
          },
          {
            label: "FunctionSequence",
          },
          {
            label: "interpolate",
            children: [
              {
                label: "ArrayInterpolator",
              },
              {
                label: "ColorInterpolator",
              },
              {
                label: "DateInterpolator",
              },
              {
                label: "Interpolator",
              },
              {
                label: "MatrixInterpolator",
              },
              {
                label: "NumberInterpolator",
              },
              {
                label: "ObjectInterpolator",
              },
              {
                label: "PointInterpolator",
              },
              {
                label: "RectangleInterpolator",
              },
            ],
          },
          {
            label: "ISchedulable",
          },
          {
            label: "Parallel",
          },
          {
            label: "Pause",
          },
          {
            label: "Scheduler",
          },
          {
            label: "Sequence",
          },
          {
            label: "Transition",
          },
          {
            label: "Transitioner",
          },
          {
            label: "TransitionEvent",
          },
          {
            label: "Tween",
          },
        ],
      },
      {
        label: "data",
        children: [
          {
            label: "converters",
            children: [
              {
                label: "Converters",
              },
              {
                label: "DelimitedTextConverter",
              },
              {
                label: "GraphMLConverter",
              },
              {
                label: "IDataConverter",
              },
              {
                label: "JSONConverter",
              },
            ],
          },
          {
            label: "DataField",
          },
          {
            label: "DataSchema",
          },
          {
            label: "DataSet",
          },
          {
            label: "DataSource",
          },
          {
            label: "DataTable",
          },
          {
            label: "DataUtil",
          },
        ],
      },
      {
        label: "display",
        children: [
          {
            label: "DirtySprite",
          },
          {
            label: "LineSprite",
          },
          {
            label: "RectSprite",
          },
          {
            label: "TextSprite",
          },
        ],
      },
      {
        label: "flex",
        children: [
          {
            label: "FlareVis",
          },
        ],
      },
      {
        label: "physics",
        children: [
          {
            label: "DragForce",
          },
          {
            label: "GravityForce",
          },
          {
            label: "IForce",
          },
          {
            label: "NBodyForce",
          },
          {
            label: "Particle",
          },
          {
            label: "Simulation",
          },
          {
            label: "Spring",
          },
          {
            label: "SpringForce",
          },
        ],
      },
      {
        label: "query",
        children: [
          {
            label: "AggregateExpression",
          },
          {
            label: "And",
          },
          {
            label: "Arithmetic",
          },
          {
            label: "Average",
          },
          {
            label: "BinaryExpression",
          },
          {
            label: "Comparison",
          },
          {
            label: "CompositeExpression",
          },
          {
            label: "Count",
          },
          {
            label: "DateUtil",
          },
          {
            label: "Distinct",
          },
          {
            label: "Expression",
          },
          {
            label: "ExpressionIterator",
          },
          {
            label: "Fn",
          },
          {
            label: "If",
          },
          {
            label: "IsA",
          },
          {
            label: "Literal",
          },
          {
            label: "Match",
          },
          {
            label: "Maximum",
          },
          {
            label: "methods",
            children: [
              {
                label: "add",
              },
              {
                label: "and",
              },
              {
                label: "average",
              },
              {
                label: "count",
              },
              {
                label: "distinct",
              },
              {
                label: "div",
              },
              {
                label: "eq",
              },
              {
                label: "fn",
              },
              {
                label: "gt",
              },
              {
                label: "gte",
              },
              {
                label: "iff",
              },
              {
                label: "isa",
              },
              {
                label: "lt",
              },
              {
                label: "lte",
              },
              {
                label: "max",
              },
              {
                label: "min",
              },
              {
                label: "mod",
              },
              {
                label: "mul",
              },
              {
                label: "neq",
              },
              {
                label: "not",
              },
              {
                label: "or",
              },
              {
                label: "orderby",
              },
              {
                label: "range",
              },
              {
                label: "select",
              },
              {
                label: "stddev",
              },
              {
                label: "sub",
              },
              {
                label: "sum",
              },
              {
                label: "update",
              },
              {
                label: "variance",
              },
              {
                label: "where",
              },
              {
                label: "xor",
              },
              {
                label: "_",
              },
            ],
          },
          {
            label: "Minimum",
          },
          {
            label: "Not",
          },
          {
            label: "Or",
          },
          {
            label: "Query",
          },
          {
            label: "Range",
          },
          {
            label: "StringUtil",
          },
          {
            label: "Sum",
          },
          {
            label: "Variable",
          },
          {
            label: "Variance",
          },
          {
            label: "Xor",
          },
        ],
      },
      {
        label: "scale",
        children: [
          {
            label: "IScaleMap",
          },
          {
            label: "LinearScale",
          },
          {
            label: "LogScale",
          },
          {
            label: "OrdinalScale",
          },
          {
            label: "QuantileScale",
          },
          {
            label: "QuantitativeScale",
          },
          {
            label: "RootScale",
          },
          {
            label: "Scale",
          },
          {
            label: "ScaleType",
          },
          {
            label: "TimeScale",
          },
        ],
      },
      {
        label: "util",
        children: [
          {
            label: "Arrays",
          },
          {
            label: "Colors",
          },
          {
            label: "Dates",
          },
          {
            label: "Displays",
          },
          {
            label: "Filter",
          },
          {
            label: "Geometry",
          },
          {
            label: "heap",
            children: [
              {
                label: "FibonacciHeap",
              },
              {
                label: "HeapNode",
              },
            ],
          },
          {
            label: "IEvaluable",
          },
          {
            label: "IPredicate",
          },
          {
            label: "IValueProxy",
          },
          {
            label: "math",
            children: [
              {
                label: "DenseMatrix",
              },
              {
                label: "IMatrix",
              },
              {
                label: "SparseMatrix",
              },
            ],
          },
          {
            label: "Maths",
          },
          {
            label: "Orientation",
          },
          {
            label: "palette",
            children: [
              {
                label: "ColorPalette",
              },
              {
                label: "Palette",
              },
              {
                label: "ShapePalette",
              },
              {
                label: "SizePalette",
              },
            ],
          },
          {
            label: "Property",
          },
          {
            label: "Shapes",
          },
          {
            label: "Sort",
          },
          {
            label: "Stats",
          },
          {
            label: "Strings",
          },
        ],
      },
      {
        label: "vis",
        children: [
          {
            label: "axis",
            children: [
              {
                label: "Axes",
              },
              {
                label: "Axis",
              },
              {
                label: "AxisGridLine",
              },
              {
                label: "AxisLabel",
              },
              {
                label: "CartesianAxes",
              },
            ],
          },
          {
            label: "controls",
            children: [
              {
                label: "AnchorControl",
              },
              {
                label: "ClickControl",
              },
              {
                label: "Control",
              },
              {
                label: "ControlList",
              },
              {
                label: "DragControl",
              },
              {
                label: "ExpandControl",
              },
              {
                label: "HoverControl",
              },
              {
                label: "IControl",
              },
              {
                label: "PanZoomControl",
              },
              {
                label: "SelectionControl",
              },
              {
                label: "TooltipControl",
              },
            ],
          },
          {
            label: "data",
            children: [
              {
                label: "Data",
              },
              {
                label: "DataList",
              },
              {
                label: "DataSprite",
              },
              {
                label: "EdgeSprite",
              },
              {
                label: "NodeSprite",
              },
              {
                label: "render",
                children: [
                  {
                    label: "ArrowType",
                  },
                  {
                    label: "EdgeRenderer",
                  },
                  {
                    label: "IRenderer",
                  },
                  {
                    label: "ShapeRenderer",
                  },
                ],
              },
              {
                label: "ScaleBinding",
              },
              {
                label: "Tree",
              },
              {
                label: "TreeBuilder",
              },
            ],
          },
          {
            label: "events",
            children: [
              {
                label: "DataEvent",
              },
              {
                label: "SelectionEvent",
              },
              {
                label: "TooltipEvent",
              },
              {
                label: "VisualizationEvent",
              },
            ],
          },
          {
            label: "legend",
            children: [
              {
                label: "Legend",
              },
              {
                label: "LegendItem",
              },
              {
                label: "LegendRange",
              },
            ],
          },
          {
            label: "operator",
            children: [
              {
                label: "distortion",
                children: [
                  {
                    label: "BifocalDistortion",
                  },
                  {
                    label: "Distortion",
                  },
                  {
                    label: "FisheyeDistortion",
                  },
                ],
              },
              {
                label: "encoder",
                children: [
                  {
                    label: "ColorEncoder",
                  },
                  {
                    label: "Encoder",
                  },
                  {
                    label: "PropertyEncoder",
                  },
                  {
                    label: "ShapeEncoder",
                  },
                  {
                    label: "SizeEncoder",
                  },
                ],
              },
              {
                label: "filter",
                children: [
                  {
                    label: "FisheyeTreeFilter",
                  },
                  {
                    label: "GraphDistanceFilter",
                  },
                  {
                    label: "VisibilityFilter",
                  },
                ],
              },
              {
                label: "IOperator",
              },
              {
                label: "label",
                children: [
                  {
                    label: "Labeler",
                  },
                  {
                    label: "RadialLabeler",
                  },
                  {
                    label: "StackedAreaLabeler",
                  },
                ],
              },
              {
                label: "layout",
                children: [
                  {
                    label: "AxisLayout",
                  },
                  {
                    label: "BundledEdgeRouter",
                  },
                  {
                    label: "CircleLayout",
                  },
                  {
                    label: "CirclePackingLayout",
                  },
                  {
                    label: "DendrogramLayout",
                  },
                  {
                    label: "ForceDirectedLayout",
                  },
                  {
                    label: "IcicleTreeLayout",
                  },
                  {
                    label: "IndentedTreeLayout",
                  },
                  {
                    label: "Layout",
                  },
                  {
                    label: "NodeLinkTreeLayout",
                  },
                  {
                    label: "PieLayout",
                  },
                  {
                    label: "RadialTreeLayout",
                  },
                  {
                    label: "RandomLayout",
                  },
                  {
                    label: "StackedAreaLayout",
                  },
                  {
                    label: "TreeMapLayout",
                  },
                ],
              },
              {
                label: "Operator",
              },
              {
                label: "OperatorList",
              },
              {
                label: "OperatorSequence",
              },
              {
                label: "OperatorSwitch",
              },
              {
                label: "SortOperator",
              },
            ],
          },
          {
            label: "Visualization",
          },
        ],
      },
    ],
  },
];

export default sampleData;
