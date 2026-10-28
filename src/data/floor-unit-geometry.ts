/**
 * Approximate selection areas projected from the annotated floor plans onto
 * the fixed 2560 × 1440 floor renders. Coordinates are relative to the image,
 * not architectural measurements. The plan-to-render mapping is calibrated
 * separately for the different source drawings.
 */
type Point = [number, number];
type Shape = { points: Point[]; marker: Point };
type Reference = {
  left: number; right: number; bottom: number; top: number; farEdge: number;
  shapes: Record<string, Shape>;
};

const front: Shape = {
  points: [[130,555],[178,555],[204,526],[225,555],[299,555],[299,525],[416,525],[416,765],[130,765]],
  marker: [23, 46],
};
const middle: Shape = {
  points: [[130,28],[273,28],[273,76],[310,76],[310,150],[273,150],[273,268],[220,268],[220,362],[296,362],[296,400],[130,400]],
  marker: [69, 39],
};
const side: Shape = {
  points: [[220,272],[283,272],[283,255],[316,255],[316,278],[335,278],[335,300],[416,300],[416,523],[315,523],[315,464],[267,464],[267,430],[296,430],[296,363],[220,363]],
  marker: [49, 64],
};

const floor2: Reference = {
  left: 75, right: 367, bottom: 760, top: 13, farEdge: 1800,
  shapes: {
    '01': { points: [[76,552],[127,552],[159,520],[180,552],[266,552],[266,518],[367,518],[367,760],[76,760]], marker: [23,46] },
    '02': { points: [[78,17],[221,17],[221,59],[258,59],[258,139],[220,139],[220,232],[170,232],[170,352],[244,352],[244,393],[78,393]], marker: [69,39] },
    '03': { points: [[220,249],[367,249],[367,515],[264,515],[264,454],[216,454],[216,420],[244,420],[244,352],[170,352],[170,267],[220,267]], marker: [49,64] },
  },
};

const standard: Reference = {
  left: 130, right: 417, bottom: 765, top: 28, farEdge: 1800,
  shapes: { '01': front, '02': middle, '03': side },
};

const floor12: Reference = {
  left: 60, right: 350, bottom: 755, top: 18, farEdge: 1800,
  shapes: {
    '01': { points: [[60,550],[108,550],[135,520],[155,550],[237,550],[237,518],[350,518],[350,755],[60,755]], marker: [23,46] },
    '02': { points: [[60,18],[205,18],[205,68],[244,68],[244,146],[205,146],[205,247],[160,247],[160,355],[235,355],[235,395],[60,395]], marker: [69,39] },
    '03': { points: [[160,266],[215,266],[215,249],[250,249],[250,270],[273,270],[273,293],[350,293],[350,515],[250,515],[250,457],[204,457],[204,425],[235,425],[235,355],[160,355]], marker: [49,64] },
  },
};

const shiftLeft = (shape: Shape, amount: number): Shape => ({
  ...shape, points: shape.points.map(([x, y]) => [x - amount, y]),
});
const floor13: Reference = {
  left: 25, right: 315, bottom: 755, top: 18, farEdge: 1800,
  shapes: {
    '01': shiftLeft(floor12.shapes['01'], 35),
    '02': { points: [[25,25],[170,25],[170,80],[205,80],[205,150],[170,150],[170,250],[115,250],[115,355],[158,355],[158,400],[25,400]], marker: [69,39] },
    '03': { points: [[115,255],[165,255],[165,250],[210,250],[210,268],[230,268],[230,290],[315,290],[315,515],[210,515],[210,460],[158,460],[158,355],[115,355]], marker: [49,64] },
  },
};

const floor14: Reference = {
  left: 60, right: 350, bottom: 755, top: 20, farEdge: 1800,
  shapes: {
    '01': floor12.shapes['01'],
    '02': { points: [[65,25],[200,25],[200,245],[160,245],[160,275],[245,275],[245,322],[345,322],[345,516],[245,516],[245,450],[202,450],[202,405],[235,405],[235,395],[65,395]], marker: [64,39] },
  },
};

const floor15: Reference = {
  ...floor14,
  shapes: {
    '01': floor12.shapes['01'],
    '02': { points: [[65,128],[204,128],[204,218],[168,218],[168,255],[209,255],[209,279],[248,279],[248,313],[346,313],[346,516],[245,516],[245,450],[202,450],[202,405],[235,405],[235,395],[65,395]], marker: [62,39] },
  },
};

const floor16: Reference = {
  left: 80, right: 345, bottom: 635, top: 50, farEdge: 1580,
  shapes: {
    '01': { points: [[81,448],[169,448],[169,465],[265,465],[265,418],[340,418],[340,635],[81,635]], marker: [22,46] },
    '02': { points: [[84,59],[207,59],[207,135],[169,135],[169,184],[209,184],[209,211],[261,211],[261,245],[344,245],[344,417],[263,417],[263,447],[224,447],[224,400],[206,400],[206,350],[239,350],[239,340],[84,340]], marker: [62,39] },
  },
};

const floor17: Reference = {
  left: 72, right: 330, bottom: 651, top: 465, farEdge: 680,
  shapes: {
    '01': { points: [[72,465],[186,465],[186,484],[218,484],[218,515],[326,515],[326,651],[72,651]], marker: [22,46] },
  },
};

export function floorUnitGeometry(floorId: string, unitId: string): { path: string; x: number; y: number } | undefined {
  const level = Number(floorId);
  const reference = level === 2 ? floor2 : level >= 3 && level <= 11 ? standard
    : level === 12 ? floor12 : level === 13 ? floor13 : level === 14 ? floor14
    : level === 15 ? floor15 : level === 16 ? floor16 : level === 17 ? floor17 : undefined;
  const shape = reference?.shapes[unitId.slice(-2)];
  if (!reference || !shape) return undefined;

  const path = shape.points.map(([x, y], index) => {
    const imageX = 200 + (reference.bottom - y) * (reference.farEdge - 200) / (reference.bottom - reference.top);
    const imageY = 286 + (x - reference.left) * 574 / (reference.right - reference.left);
    return `${index === 0 ? 'M' : 'L'} ${(imageX / 2048 * 100).toFixed(2)},${(imageY / 1152 * 100).toFixed(2)}`;
  }).join(' ') + ' Z';
  return { path, x: shape.marker[0], y: shape.marker[1] };
}
