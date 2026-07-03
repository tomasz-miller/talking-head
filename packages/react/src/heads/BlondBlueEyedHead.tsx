import type { Viseme } from "@talking-head/core";
import { useId } from "react";

/**
 * Every hand-tuned coordinate for the avatar, grouped by facial feature and expressed in the
 * `viewBox="0 0 300 360"` coordinate space that the `<svg>` below uses. Each group documents
 * what increasing/decreasing its values does, so the face can be re-proportioned or re-styled
 * without reverse-engineering raw path data.
 */

/** Horizontal center shared by every symmetric feature (face, eyes, brows, mouth, hair). */
const CENTER_X = 150;

/** The skin-colored face oval that all other features are positioned relative to. */
const FACE = {
  /** Vertical center of the face oval. Raising it shifts the whole face up. */
  centerY: 208,
  /** Half-width of the face oval. Wider + shorter than a neutral oval for a broader, squarer look. */
  radiusX: 100,
  /** Half-height of the face oval. Increase for a longer face. */
  radiusY: 104,
};

/** Gradient stops for the face — a noticeably tanned/orange tone rather than a neutral skin tone. */
const FACE_SKIN = {
  highlight: "#ffcf9a",
  shadow: "#e2853f",
};

/**
 * A lighter "goggle" ring of untouched skin around each eye — the classic tan-line caricature
 * detail. Drawn after the face fill but before the eyebrows/eyes, so it reads as skin, not makeup.
 * Kept close in value to `FACE_SKIN.highlight` (not a pale cream) and sized tightly around the
 * eyes so it reads as a subtle tan gradient rather than a stark, high-contrast patch.
 */
const TAN_LINE = {
  radiusX: 22,
  radiusY: 16,
  color: "#f6c98d",
};

/** Eye whites, irises and catch-light highlights. */
const EYES = {
  /** Vertical position of both eyes. */
  y: 188,
  /** Distance of each eye's center from `CENTER_X` (left eye = CENTER_X - offsetX, etc). */
  offsetX: 32,
  /** Size of the white sclera ellipse behind the iris. Shorter `whiteRadiusY` reads as a squint. */
  whiteRadiusX: 16,
  whiteRadiusY: 8,
  /** Size of the colored iris. Change together with `EYE_COLOR` to re-color the eyes. */
  irisRadius: 7,
  /** Size and offset of the small catch-light dot that gives the eyes a glossy look. */
  highlightRadius: 2.5,
  highlightOffsetX: 2,
  highlightOffsetY: -2,
};

/** Eyebrow arches, one per eye, aligned to `EYES.offsetX` so they stay centered above the eyes. */
const EYEBROWS = {
  /** Height of the brow's outer corners (resting position). */
  y: 158,
  /** How far the middle of the brow lifts above `y`. Kept low/flat for a stern, serious brow. */
  arch: 4,
  /** Horizontal half-span of each brow — wide and bold. */
  halfWidth: 13,
  /** Golden-brown, close to the hair color rather than a neutral brown. */
  color: "#c9a05a",
};

/** Small shading ellipse suggesting the nose bridge/tip. */
const NOSE = {
  /** Sits level with the face's vertical center; move independently if a longer nose is desired. */
  centerY: FACE.centerY,
  radiusX: 8,
  radiusY: 12,
};

/**
 * The hair mass drawn *behind* the face oval — here representing short, closely-cropped sides,
 * visible only where it pokes out past the face silhouette near the temples. It is built from two
 * nested curves — an outer silhouette and an inner one — that must stay a consistent distance
 * apart; letting them converge to a single point leaves almost no visible hair (and a gap of bare
 * background) framing the face. Every field below is a left-side coordinate; the right side is
 * mirrored automatically around `CENTER_X`. The signature swept-over top is a separate,
 * intentionally asymmetric shape — see `HAIR_SWEEP` below.
 */
const HAIR_BACK = {
  /** Y of the topmost point of the cropped-side hair. Smaller = taller. */
  crownApexY: 45,
  /** Y of the inner apex; `crownApexY` to `innerApexY` is the thickness at the very top. */
  innerApexY: 70,
  /** Outer silhouette: where the short side hair is visible past the face, down to temple height. */
  outer: {
    sideX: 58,
    sideY: 165,
    controlX: 68,
    controlY: 50,
  },
  /**
   * Inner boundary: kept to the right of the face's own edge at *every* height along the curve
   * (not just at its endpoint — a previous revision only checked the endpoint and left a real
   * background gap around y=110-140, see `FACE`) so the hair fill always reaches under the face
   * oval with no background showing between hair and skin. `controlX` is deliberately close to
   * `CENTER_X` so the curve tracks the face's own rounded edge instead of cutting inward too fast.
   */
  inner: {
    sideX: 100,
    sideY: 155,
    controlX: 140,
    controlY: 90,
  },
};

function mirrorX(x: number): number {
  return 2 * CENTER_X - x;
}

/** Builds the closed path for the cropped-side `Hair back` silhouette described by `HAIR_BACK`. */
function buildHairBackPath(): string {
  const { crownApexY, innerApexY, outer, inner } = HAIR_BACK;

  return [
    `M ${outer.sideX} ${outer.sideY}`,
    `Q ${outer.controlX} ${outer.controlY} ${CENTER_X} ${crownApexY}`,
    `Q ${mirrorX(outer.controlX)} ${outer.controlY} ${mirrorX(outer.sideX)} ${outer.sideY}`,
    `L ${mirrorX(inner.sideX)} ${inner.sideY}`,
    `Q ${mirrorX(inner.controlX)} ${inner.controlY} ${CENTER_X} ${innerApexY}`,
    `Q ${inner.controlX} ${inner.controlY} ${inner.sideX} ${inner.sideY}`,
    "Z",
  ].join(" ");
}

/**
 * The signature voluminous, combed-over top: swept up from one side (the subject's right) into a
 * tall crown, then down across the forehead to a flicked tip over the opposite temple. Unlike
 * every other feature this one is deliberately *not* mirror-symmetric — that asymmetry is what
 * reads as "combed over" rather than a plain, centered fringe. Drawn on top of the face, so
 * (unlike `HAIR_BACK`) it doesn't need to hide behind anything — but its *underside* points
 * (`base`, `tip`, `foreheadLow`) still need to land well inside the face oval, with a comfortable
 * margin past the face edge, otherwise this shape ends up as a separate blob that doesn't visually
 * connect to the head at all, showing bare background between the two.
 */
const HAIR_SWEEP = {
  /** Where the sweep starts, low on the right, overlapping into the cropped side hair. */
  base: { x: 185, y: 145 },
  /** Top of the crown the sweep rises to before curling over. */
  crown: { x: 160, y: 20 },
  /** Highest, left-most point of the sweep, just past center. */
  peak: { x: 85, y: 28 },
  /** The flicked tip hanging down over the left temple/forehead — the "comb-over" giveaway. */
  tip: { x: 105, y: 130 },
  /** Where the underside of the sweep crosses the mid-forehead on its way back to `base`. */
  foreheadLow: { x: 150, y: 145 },
};

/** Builds the closed path for the asymmetric `Hair sweep` (comb-over) described by `HAIR_SWEEP`. */
function buildHairSweepPath(): string {
  const { base, crown, peak, tip, foreheadLow } = HAIR_SWEEP;

  return [
    `M ${base.x} ${base.y}`,
    `Q 222 70 ${crown.x} ${crown.y}`,
    `Q 120 6 ${peak.x} ${peak.y}`,
    `Q 66 60 ${tip.x} ${tip.y}`,
    `Q 122 128 ${foreheadLow.x} ${foreheadLow.y}`,
    `Q 178 120 ${base.x} ${base.y}`,
    "Z",
  ].join(" ");
}

/** Shared baseline that every mouth shape's corners sit on. */
const MOUTH = {
  centerX: CENTER_X,
  baselineY: 246,
};

/** Fill color for the mouth cavity, shared by every viseme's main shape. */
const MOUTH_FILL = "#b5675c";

interface MouthShapeParams {
  /** Half-distance between the two mouth corners. Larger = wider mouth. */
  halfWidth: number;
  /** How far the upper lip lifts *above* the baseline at the mouth's center. 0 = flat/resting. */
  upperLift: number;
  /** How far the lower lip/jaw drops *below* the baseline at the mouth's center. Larger = more open. */
  lowerDrop: number;
}

/**
 * Builds a symmetric, lens-shaped ("vesica") mouth path: two corners sit on the baseline, the
 * upper boundary bows *up* by `upperLift` and the lower boundary bows *down* by `lowerDrop`, so
 * the shape has real height at the center (`upperLift + lowerDrop`) that tapers to zero at the
 * corners — like an open eye. Control points are placed at twice the requested lift/drop because
 * a quadratic Bézier's midpoint is the average of its endpoint and control point; this keeps
 * `upperLift`/`lowerDrop` equal to the actual visible depth, so they're easy to reason about.
 */
function createMouthPath({ halfWidth, upperLift, lowerDrop }: MouthShapeParams): string {
  const { centerX: cx, baselineY: y } = MOUTH;
  const left = cx - halfWidth;
  const right = cx + halfWidth;
  const upperControlY = y - upperLift * 2;
  const lowerControlY = y + lowerDrop * 2;

  return [
    `M ${left} ${y}`,
    `Q ${cx} ${upperControlY} ${right} ${y}`,
    `Q ${cx} ${lowerControlY} ${left} ${y}`,
    "Z",
  ].join(" ");
}

interface MouthShapeDescriptor {
  /** Polish letters/sounds this viseme stands in for (see `@talking-head/core` viseme-mapper). */
  phonemes: string;
  /** Plain-language articulation this shape is meant to depict. */
  description: string;
  /** Main lip/mouth-cavity path, built with `createMouthPath`. */
  path: string;
  /** Optional small accent (teeth or tongue) layered on top of `path` for extra realism. */
  detail?: { path: string; fill: string };
}

const TEETH_FILL = "#fffaf2";
const TONGUE_FILL = "#e1727a";

const MOUTH_SHAPES: Record<Viseme, MouthShapeDescriptor> = {
  rest: {
    phonemes: "silence, punctuation, whitespace",
    description:
      "A small, protruding pucker rather than a flat closed line — the idle/neutral shape " +
      "between words, deliberately narrower than the other visemes for a pursed-lips look.",
    path: createMouthPath({ halfWidth: 18, upperLift: 3, lowerDrop: 6 }),
  },
  BMP: {
    phonemes: "b, m, p",
    description:
      "Lips pressed fully together for the bilabial closure — flatter and tighter than `rest`.",
    path: createMouthPath({ halfWidth: 26, upperLift: 0, lowerDrop: 1.5 }),
  },
  FV: {
    phonemes: "f, v, w",
    description:
      "Upper teeth rest on the lower lip: the upper boundary stays flat (`upperLift: 0`, like an " +
      "even row of teeth) while only the lower lip dips, unlike vowels where both lips move.",
    path: createMouthPath({ halfWidth: 24, upperLift: 0, lowerDrop: 5 }),
    detail: {
      fill: TEETH_FILL,
      // A thin sliver sitting right on the flat upper boundary, suggesting visible teeth.
      path: `M ${MOUTH.centerX - 18} ${MOUTH.baselineY - 2} Q ${MOUTH.centerX} ${
        MOUTH.baselineY - 5
      } ${MOUTH.centerX + 18} ${MOUTH.baselineY - 2} Q ${MOUTH.centerX} ${MOUTH.baselineY} ${
        MOUTH.centerX - 18
      } ${MOUTH.baselineY - 2} Z`,
    },
  },
  L: {
    phonemes: "l",
    description:
      "Mouth partly open with the tongue tip raised behind the upper teeth — the small tongue " +
      "accent below is what visually separates this from the plain open shapes.",
    path: createMouthPath({ halfWidth: 21, upperLift: 3, lowerDrop: 8 }),
    detail: {
      fill: TONGUE_FILL,
      // Small rounded tip peeking up from the bottom-center of the opening.
      path: `M ${MOUTH.centerX - 7} ${MOUTH.baselineY + 6} Q ${MOUTH.centerX} ${
        MOUTH.baselineY - 1
      } ${MOUTH.centerX + 7} ${MOUTH.baselineY + 6} Q ${MOUTH.centerX} ${
        MOUTH.baselineY + 10
      } ${MOUTH.centerX - 7} ${MOUTH.baselineY + 6} Z`,
    },
  },
  A: {
    phonemes: "a, ą",
    description: "Widest, tallest opening — the jaw drops fully for an open \"ah\".",
    path: createMouthPath({ halfWidth: 34, upperLift: 5, lowerDrop: 28 }),
  },
  E: {
    phonemes:
      "e, ę, i, y — also the default fallback shape used for plain consonants that aren't " +
      "covered by another viseme (see CONSONANT_DEFAULT in viseme-mapper.ts)",
    description:
      "Corners spread wide (like a gentle smile) with a moderate opening. Kept natural rather " +
      "than an exaggerated grin, since it doubles as the generic \"talking\" shape.",
    path: createMouthPath({ halfWidth: 30, upperLift: 6, lowerDrop: 12 }),
  },
  O: {
    phonemes: "o, ó",
    description:
      "Rounded, protruded lips: narrower than `A` but with the opening's height approaching its " +
      "width, instead of just being a scaled-down wide vowel.",
    path: createMouthPath({ halfWidth: 20, upperLift: 8, lowerDrop: 19 }),
  },
  U: {
    phonemes: "u",
    description:
      "Small, tight, rounded pucker — the narrowest corners of any viseme, distinctly smaller " +
      "than `O` so the two don't read as the same shape at different sizes.",
    path: createMouthPath({ halfWidth: 12, upperLift: 5, lowerDrop: 13 }),
  },
};

export interface BlondBlueEyedHeadProps {
  viseme?: Viseme;
  className?: string;
  width?: number;
  height?: number;
}

export function BlondBlueEyedHead({
  viseme = "rest",
  className,
  width = 300,
  height = 360,
}: BlondBlueEyedHeadProps) {
  const reactId = useId().replace(/:/g, "");
  const faceGradientId = `faceGradient-${reactId}`;
  const hairGradientId = `hairGradient-${reactId}`;

  const leftEyeX = CENTER_X - EYES.offsetX;
  const rightEyeX = CENTER_X + EYES.offsetX;

  return (
    <svg
      className={className}
      width={width}
      height={height}
      viewBox="0 0 300 360"
      role="img"
      aria-label="Talking head avatar"
    >
      {/* Hair mass behind the head: only the parts outside the face oval below stay visible. */}
      <g aria-label="Hair back">
        <path d={buildHairBackPath()} fill={`url(#${hairGradientId})`} />
      </g>

      {/* The face itself — every other feature is positioned relative to this oval. */}
      <ellipse
        cx={CENTER_X}
        cy={FACE.centerY}
        rx={FACE.radiusX}
        ry={FACE.radiusY}
        fill={`url(#${faceGradientId})`}
      />

      {/* Tan-line "goggles": a lighter ring of skin left around each eye, drawn before the hair
          sweep/eyebrows/eyes so those still render normally on top. */}
      <g aria-label="Tan line">
        <ellipse cx={leftEyeX} cy={EYES.y - 2} rx={TAN_LINE.radiusX} ry={TAN_LINE.radiusY} fill={TAN_LINE.color} />
        <ellipse cx={rightEyeX} cy={EYES.y - 2} rx={TAN_LINE.radiusX} ry={TAN_LINE.radiusY} fill={TAN_LINE.color} />
      </g>

      {/* Combed-over top, swept from one side across the forehead — see HAIR_SWEEP for why this
          shape is intentionally asymmetric instead of mirrored like the rest of the face. */}
      <g aria-label="Hair sweep">
        <path d={buildHairSweepPath()} fill={`url(#${hairGradientId})`} />
      </g>

      <defs>
        <radialGradient id={faceGradientId} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={FACE_SKIN.highlight} />
          <stop offset="100%" stopColor={FACE_SKIN.shadow} />
        </radialGradient>
        <linearGradient id={hairGradientId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f7d060" />
          <stop offset="100%" stopColor="#d99a2b" />
        </linearGradient>
      </defs>

      {/* Eyes: white sclera + colored iris + small catch-light, mirrored around CENTER_X. */}
      <g aria-label="Eyes">
        <ellipse cx={leftEyeX} cy={EYES.y} rx={EYES.whiteRadiusX} ry={EYES.whiteRadiusY} fill="#ffffff" />
        <ellipse cx={rightEyeX} cy={EYES.y} rx={EYES.whiteRadiusX} ry={EYES.whiteRadiusY} fill="#ffffff" />
        <circle cx={leftEyeX} cy={EYES.y} r={EYES.irisRadius} fill="#4a90e2" />
        <circle cx={rightEyeX} cy={EYES.y} r={EYES.irisRadius} fill="#4a90e2" />
        <circle
          cx={leftEyeX + EYES.highlightOffsetX}
          cy={EYES.y + EYES.highlightOffsetY}
          r={EYES.highlightRadius}
          fill="#ffffff"
        />
        <circle
          cx={rightEyeX + EYES.highlightOffsetX}
          cy={EYES.y + EYES.highlightOffsetY}
          r={EYES.highlightRadius}
          fill="#ffffff"
        />
      </g>

      {/* Eyebrows: one arch per eye, aligned via the same EYES.offsetX. */}
      <g aria-label="Eyebrows">
        <path
          d={`M ${leftEyeX - EYEBROWS.halfWidth} ${EYEBROWS.y} Q ${leftEyeX} ${
            EYEBROWS.y - EYEBROWS.arch
          } ${leftEyeX + EYEBROWS.halfWidth} ${EYEBROWS.y}`}
          stroke={EYEBROWS.color}
          strokeWidth="4"
          fill="none"
        />
        <path
          d={`M ${rightEyeX - EYEBROWS.halfWidth} ${EYEBROWS.y} Q ${rightEyeX} ${
            EYEBROWS.y - EYEBROWS.arch
          } ${rightEyeX + EYEBROWS.halfWidth} ${EYEBROWS.y}`}
          stroke={EYEBROWS.color}
          strokeWidth="4"
          fill="none"
        />
      </g>

      {/* Nose: a single soft shading ellipse, no outline. */}
      <ellipse cx={CENTER_X} cy={NOSE.centerY} rx={NOSE.radiusX} ry={NOSE.radiusY} fill="#e8b4a0" />

      {/* Mouth: all viseme shapes are stacked and cross-faded by opacity on prop change. */}
      <g aria-label="Mouth">
        {(Object.keys(MOUTH_SHAPES) as Viseme[]).map((shape) => {
          const { path, detail } = MOUTH_SHAPES[shape];
          return (
            <g
              key={shape}
              opacity={shape === viseme ? 1 : 0}
              style={{ transition: "opacity 100ms ease" }}
            >
              <path d={path} fill={MOUTH_FILL} />
              {detail ? <path d={detail.path} fill={detail.fill} /> : null}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
