import * as d3 from "d3";

/**
 * Finds a colormap specified by name.
 * @param name The name of the colormap.
 * @returns The colormap.
 */
const findColormap = (name?: string) => {
  // We use the names of schemes and interpolates directly from D3 to make a mapping from colormap names to colormap
  // ranges. We also add some additonal mappings for more sensible naming conventions especially for creating
  // enumerations.
  const schemesOrdinal: Record<string, readonly string[]> = {
    category: d3.schemeCategory10,
    category10: d3.schemeCategory10,
    accent: d3.schemeAccent,
    dark: d3.schemeDark2,
    dark1: d3.schemeDark2,
    dark2: d3.schemeDark2,
    paired: d3.schemePaired,
    pastel: d3.schemePastel1,
    pastel1: d3.schemePastel1,
    pastel2: d3.schemePastel2,
    set1: d3.schemeSet1,
    set2: d3.schemeSet2,
    set3: d3.schemeSet3,
    tableau: d3.schemeTableau10,
    tableau10: d3.schemeTableau10,
  };
  const schemesHues: Record<string, readonly (readonly string[])[]> = {
    // Diverging.
    BrBG: d3.schemeBrBG,
    PRGn: d3.schemePRGn,
    PiYG: d3.schemePiYG,
    PuOr: d3.schemePuOr,
    RdBu: d3.schemeRdBu,
    RdGy: d3.schemeRdGy,
    RdYlBu: d3.schemeRdYlBu,
    RdYlGn: d3.schemeRdYlGn,
    spectral: d3.schemeSpectral,

    // Non-diverging.
    BuGn: d3.schemeBuGn,
    BuPu: d3.schemeBuPu,
    GnBu: d3.schemeGnBu,
    OrRd: d3.schemeOrRd,
    PuBuGn: d3.schemePuBuGn,
    PuBu: d3.schemePuBu,
    PuRd: d3.schemePuRd,
    RdPu: d3.schemeRdPu,
    YlGnBu: d3.schemeYlGnBu,
    YlGn: d3.schemeYlGn,
    YlOrBr: d3.schemeYlOrBr,
    YlOrRd: d3.schemeYlOrRd,

    // Single hue.
    blues: d3.schemeBlues,
    greens: d3.schemeGreens,
    greys: d3.schemeGreys,
    oranges: d3.schemeOranges,
    purples: d3.schemePurples,
    reds: d3.schemeReds,
  };

  const interpolates: Record<string, (t: number) => string> = {
    // Diverging.
    BrBG: d3.interpolateBrBG,
    PRGn: d3.interpolatePRGn,
    PiYG: d3.interpolatePiYG,
    PuOr: d3.interpolatePuOr,
    RdBu: d3.interpolateRdBu,
    RdGy: d3.interpolateRdGy,
    RdYlBu: d3.interpolateRdYlBu,
    RdYlGn: d3.interpolateRdYlGn,
    spectral: d3.interpolateSpectral,

    // Non-diverging.
    BuGn: d3.interpolateBuGn,
    BuPu: d3.interpolateBuPu,
    GnBu: d3.interpolateGnBu,
    OrRd: d3.interpolateOrRd,
    PuBuGn: d3.interpolatePuBuGn,
    PuBu: d3.interpolatePuBu,
    PuRd: d3.interpolatePuRd,
    RdPu: d3.interpolateRdPu,
    YlGnBu: d3.interpolateYlGnBu,
    YlGn: d3.interpolateYlGn,
    YlOrBr: d3.interpolateYlOrBr,
    YlOrRd: d3.interpolateYlOrRd,

    // Single hue.
    blues: d3.interpolateBlues,
    greens: d3.interpolateGreens,
    greys: d3.interpolateGreys,
    oranges: d3.interpolateOranges,
    purples: d3.interpolatePurples,
    reds: d3.interpolateReds,

    // Multiple hue.
    turbo: d3.interpolateTurbo,
    viridis: d3.interpolateViridis,
    inferno: d3.interpolateInferno,
    magma: d3.interpolateMagma,
    plasma: d3.interpolatePlasma,
    cividis: d3.interpolateCividis,
    warm: d3.interpolateWarm,
    cool: d3.interpolateCool,
    cubehelix: d3.interpolateCubehelixDefault,
    cubehelixDefault: d3.interpolateCubehelixDefault,
    rainbow: d3.interpolateRainbow,
    sinebow: d3.interpolateSinebow,
  };

  // Ordinal color schemes do not support indices.
  // Diverging color schemes support indices in [3, 11].
  // Single hue color schemes support indices in [3, 9].
  // Multiple hue color schemes support indices in [3, 9].
  const defaultColors: readonly string[] = ["#bbb", "#444"];
  if (!name) return d3.scaleSequential(defaultColors);

  // Try categorical.
  if (name in schemesOrdinal) {
    return d3.scaleOrdinal<number, string>(schemesOrdinal[name]);
  }

  // Try interpolate to categorical.
  const match = name.match(/([a-zA-Z]+)(\d+)/);
  if (match !== null) {
    const index = parseInt(match[1]);
    name = match[0];

    // If we cannot find a categorical scheme with the correct number of items, we use a interpolative scheme.
    // Ideally, these should work identically in most circumstances.
    if (name in schemesHues) {
      const scheme = schemesHues[name][index];
      if (scheme) {
        return d3.scaleOrdinal<number, string>(schemesHues[name][index]);
      }
    } else {
      return d3.scaleSequential(interpolates[name]);
    }
  }

  // Try interpolate.
  if (name in interpolates) return d3.scaleSequential(interpolates[name]);

  // Default.
  return d3.scaleSequential(defaultColors);
};

export { findColormap };
