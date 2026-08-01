#!/usr/bin/env python3
"""Build UM Sans 2.1 Original Candidate from independent geometric sources.

This builder does not read, transform or subset Inter or any other typeface.
Every outline is generated from UMSA-authored geometric primitives kept in
this file. The release remains a beta until authorship, similarity, trademark
and physical-device reviews are signed by independent reviewers.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from copy import deepcopy
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import unicodedata
import zipfile

import pathops
from defcon import Font as UFOFont
from fontTools import agl
from fontTools.designspaceLib import AxisDescriptor, DesignSpaceDocument, InstanceDescriptor, SourceDescriptor
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.qu2cuPen import Qu2CuPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.pens.t2CharStringPen import T2CharStringPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont, newTable
from fontTools.ttLib.removeOverlaps import removeOverlaps
from fontTools.ttLib.tables._g_l_y_f import OVERLAP_COMPOUND, flagOverlapSimple
from fontTools.ttLib.tables.ttProgram import Program
from ttfautohint import ttfautohint

# The manual control master is an internal UMSA drawing source. Reusing its
# explicit cubic paths here keeps the complete-family builder independent from
# third-party outlines while giving the visible core glyphs the same smooth
# construction used for word-level review. The source module has no side
# effects unless invoked as a script.
from bootstrap_um_sans_2_manual_alpha import (
    draw_F as draw_manual_F,
    draw_H as draw_manual_H,
    draw_a as draw_manual_a,
    draw_b as draw_manual_b,
    draw_c as draw_manual_c,
    draw_d as draw_manual_d,
    draw_e as draw_manual_e,
    draw_f as draw_manual_f,
    draw_i as draw_manual_i,
    draw_l as draw_manual_l,
    draw_n as draw_manual_n,
    draw_o as draw_manual_o,
    draw_p as draw_manual_p,
    draw_r as draw_manual_r,
    draw_s as draw_manual_s,
    draw_t as draw_manual_t,
    draw_u as draw_manual_u,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = Path(
    os.environ.get("UM_SANS_2_OUTPUT", ROOT / "public" / "fonts" / "um-sans-2")
).expanduser().resolve()
SOURCE_OUTPUT = OUTPUT / "sources"
MASTER_OUTPUT = OUTPUT / "masters"

FAMILY = "UM Sans 2"
VERSION = "2.100"
VERSION_LABEL = "2.1 Original Candidate"
VENDOR = "UMSA"
UPM = 1000
ASCENDER = 820
DESCENDER = -220
LINE_GAP = 0
# OpenType stores seconds since 1904, not Unix seconds.
BUILD_EPOCH = 3_867_456_000
ZIP_TIMESTAMP = (2026, 7, 14, 0, 0, 0)

COPYRIGHT = "Copyright 2026 ULTIMA MILLA S.A. Original outlines by UMSA Design Engineering."
DESCRIPTION = (
    "UM Sans 2.1 Original Candidate is an independently constructed geometric "
    "editorial sans for ULTIMA MILLA. No upstream font outlines are read or "
    "transformed by its build pipeline."
)

WEIGHTS = (
    (300, "Light"),
    (400, "Regular"),
    (500, "Medium"),
    (600, "SemiBold"),
    (700, "Bold"),
    (800, "ExtraBold"),
    (900, "Black"),
)

MASTER_LOCATIONS = (
    (300, 14),
    (300, 72),
    (400, 18),
    (900, 14),
    (900, 72),
)

HINTING_POLICY = {
    "no_info": True,
    "hint_composites": True,
    "default_script": "latn",
    "fallback_script": "latn",
    "windows_compatibility": False,
    "increase_x_height": 14,
    "hinting_range_min": 8,
    "hinting_range_max": 50,
    "hinting_limit": 200,
}

COMBINING_MARKS = {
    "\u0300": "gravecomb",
    "\u0301": "acutecomb",
    "\u0302": "circumflexcomb",
    "\u0303": "tildecomb",
    "\u0304": "macroncomb",
    "\u0306": "brevecomb",
    "\u0307": "dotaccentcomb",
    "\u0308": "dieresiscomb",
    "\u030a": "ringcomb",
    "\u030b": "hungarumlautcomb",
    "\u030c": "caroncomb",
    "\u0327": "cedillacomb",
    "\u0328": "ogonekcomb",
}

SPECIAL_LATIN_CHARS = "\u00adÆÐØÞßæðøþĐđĦħıĲĳĸĿŀŁłŉŊŋŒœŦŧſ"

BASE_CHARS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "0123456789"
    " !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~"
    "\u00a0¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿"
    "×÷–—‘’‚“”„•…€™←↑→↓↗↘"
    + SPECIAL_LATIN_CHARS
)

SPECIAL_LATIN_WIDTHS = {
    "\u00ad": 0,
    "Æ": 980, "Ð": 760, "Ø": 780, "Þ": 760, "ß": 690,
    "æ": 930, "ð": 650, "ø": 650, "þ": 650,
    "Đ": 760, "đ": 650, "Ħ": 760, "ħ": 660, "ı": 252,
    "Ĳ": 1050, "ĳ": 540, "ĸ": 590, "Ŀ": 760, "ŀ": 300,
    "Ł": 760, "ł": 300, "ŉ": 650, "Ŋ": 790, "ŋ": 650,
    "Œ": 1040, "œ": 980, "Ŧ": 760, "ŧ": 520, "ſ": 520,
}

KERN_PAIRS = {
    ("A", "V"): -58, ("A", "W"): -42, ("A", "Y"): -62,
    ("F", "a"): -36, ("F", "o"): -34, ("L", "T"): -42,
    ("L", "V"): -52, ("L", "Y"): -58, ("P", "a"): -32,
    ("P", "o"): -26, ("T", "a"): -52, ("T", "e"): -46,
    ("T", "o"): -48, ("T", "u"): -34, ("V", "a"): -54,
    ("V", "e"): -46, ("V", "o"): -48, ("W", "a"): -38,
    ("W", "o"): -32, ("Y", "a"): -64, ("Y", "e"): -54,
    ("Y", "o"): -58, ("r", "a"): -13, ("r", "e"): -11,
    ("r", "o"): -13, ("v", "a"): -22, ("w", "a"): -16,
    ("y", "a"): -23, ("T", "."): -70, ("V", "."): -62,
    ("W", "."): -48, ("Y", "."): -72, ("P", "."): -54,
    ("¿", "A"): -20, ("¡", "A"): -14,
}


@dataclass(frozen=True)
class Design:
    weight: int
    optical_size: int
    italic: bool

    @property
    def stem(self) -> float:
        # The first beta used an almost monoline 58–142 range. It survived at
        # poster sizes but collapsed into a fragile decorative texture in UI
        # copy. These optical anchors preserve a real reading cut at 400 and
        # give 700–900 the rounded, assertive mass expected from the family.
        anchors = (
            (300, 58.0),
            (400, 76.0),
            (500, 96.0),
            (600, 118.0),
            (700, 142.0),
            (800, 164.0),
            (900, 186.0),
        )
        for (weight_a, stem_a), (weight_b, stem_b) in zip(anchors, anchors[1:]):
            if self.weight <= weight_b:
                progress = (self.weight - weight_a) / (weight_b - weight_a)
                return stem_a + (stem_b - stem_a) * progress
        return anchors[-1][1]

    @property
    def cap(self) -> float:
        t = (self.optical_size - 14) / 58
        return 724 - 10 * t

    @property
    def x_height(self) -> float:
        t = (self.optical_size - 14) / 58
        return 548 - 22 * t

    @property
    def side(self) -> float:
        text_to_display = (self.optical_size - 14) / 58
        weight_factor = (self.weight - 300) / 600
        return 64 - 24 * text_to_display - 7 * weight_factor

    @property
    def shear(self) -> float:
        return math.tan(math.radians(10.5)) if self.italic else 0


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def glyph_name(character: str) -> str:
    codepoint = ord(character)
    return agl.UV2AGL.get(codepoint, f"uni{codepoint:04X}")


def rect(pen, x0: float, y0: float, x1: float, y1: float, reverse: bool = False) -> None:
    # Outer contours use a single clockwise winding throughout the builder.
    # Mixing counter-clockwise rectangles with clockwise rings makes boolean
    # cleanup interpret overlaps as counters, visibly punching holes in joins.
    points = [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
    if reverse:
        points.reverse()
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def polygon(pen, points: list[tuple[float, float]], reverse: bool = False) -> None:
    # Filled shapes must keep one winding direction regardless of the source
    # stroke direction. The previous implementation inherited the direction of
    # each polyline, so joins such as f/t/n/r could be interpreted as counters
    # after overlap removal and render as white cuts through the letter.
    signed_area = sum(
        x0 * y1 - x1 * y0
        for (x0, y0), (x1, y1) in zip(points, points[1:] + points[:1])
    )
    should_be_clockwise = not reverse
    is_clockwise = signed_area < 0
    if is_clockwise != should_be_clockwise:
        points = list(reversed(points))
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def ellipse_contour(
    pen,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    clockwise: bool = True,
) -> None:
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    rx, ry = (x1 - x0) / 2, (y1 - y0) / 2
    step = -math.pi / 4 if clockwise else math.pi / 4
    angles = [index * step for index in range(9)]

    def on_curve(angle: float) -> tuple[float, float]:
        return cx + rx * math.cos(angle), cy + ry * math.sin(angle)

    first_point = on_curve(angles[0])
    pen.moveTo(first_point)
    for segment_index, (start, end) in enumerate(zip(angles, angles[1:])):
        middle = (start + end) / 2
        scale = 1 / math.cos((end - start) / 2)
        control = (
            cx + rx * math.cos(middle) * scale,
            cy + ry * math.sin(middle) * scale,
        )
        end_point = first_point if segment_index == 7 else on_curve(end)
        pen.qCurveTo(control, end_point)
    pen.closePath()


def ellipse(pen, x0: float, y0: float, x1: float, y1: float) -> None:
    ellipse_contour(pen, x0, y0, x1, y1, clockwise=True)


def ring(
    pen,
    x0: float,
    y0: float,
    x1: float,
    y1: float,
    thickness: float,
) -> None:
    ellipse_contour(pen, x0, y0, x1, y1, clockwise=True)
    inset_x = min(thickness, (x1 - x0) * 0.34)
    inset_y = min(thickness, (y1 - y0) * 0.34)
    ellipse_contour(
        pen,
        x0 + inset_x,
        y0 + inset_y,
        x1 - inset_x,
        y1 - inset_y,
        clockwise=False,
    )


def stroke_polyline(
    pen,
    points: list[tuple[float, float]],
    thickness: float,
    round_caps: bool = False,
) -> None:
    clean_points = [points[0]] if points else []
    for point in points[1:]:
        if math.hypot(point[0] - clean_points[-1][0], point[1] - clean_points[-1][1]) > 0.001:
            clean_points.append(point)
    if len(clean_points) < 2:
        return

    # Delegate expansion to Skia PathOps instead of approximating offsets by
    # hand. The manual miter math generated self-intersections and inverted
    # wedges in A/V/W, plus white seams at f/t/n/r joins. Skia returns one
    # consistently wound outline with bounded round joins.
    centerline = pathops.Path()
    centerline.moveTo(*clean_points[0])
    for point in clean_points[1:]:
        centerline.lineTo(*point)
    centerline.stroke(
        thickness,
        pathops.LineCap.ROUND_CAP if round_caps else pathops.LineCap.BUTT_CAP,
        pathops.LineJoin.ROUND_JOIN,
        2.0,
    )
    centerline.convertConicsToQuads(0.35)
    # Skia may emit a stroked contour counter-clockwise depending on the
    # direction of the centreline.  Normalize every expanded stroke before it
    # is combined with clockwise rectangles and rings; otherwise intersections
    # become subtraction zones (the horizontal cuts previously visible in A,
    # N, M and the lower-case joins).
    outlined = pathops.simplify(
        centerline,
        fix_winding=True,
        keep_starting_points=True,
        clockwise=True,
    )
    outlined.draw(pen)


MANUAL_LOWER_CORE = {
    "a": (606, draw_manual_a),
    "b": (636, draw_manual_b),
    "c": (584, draw_manual_c),
    "d": (610, draw_manual_d),
    "e": (616, draw_manual_e),
    "f": (472, draw_manual_f),
    "i": (252, draw_manual_i),
    "l": (252, draw_manual_l),
    "n": (632, draw_manual_n),
    "o": (624, draw_manual_o),
    "p": (636, draw_manual_p),
    "r": (492, draw_manual_r),
    "s": (584, draw_manual_s),
    "t": (498, draw_manual_t),
    "u": (632, draw_manual_u),
}

MANUAL_UPPER_CORE = {
    "F": (690, draw_manual_F),
    "H": (700, draw_manual_H),
}


def draw_manual_core(pen, character: str, width: float, d: Design, core: dict) -> bool:
    """Place an explicit manual core drawing into the current design metrics."""
    if character not in core:
        return False
    source_width, draw = core[character]
    if character in {"b", "d", "f", "p"}:
        source_height = 760
        target_height = d.cap
    elif character in {"i", "l"}:
        source_height = 602
        target_height = d.x_height
    else:
        source_height = 540
        target_height = d.x_height
    transform = TransformPen(
        pen,
        (width / source_width, 0, 0, target_height / source_height, 0, 0),
    )
    draw(transform)
    return True


def sampled_arc(
    cx: float,
    cy: float,
    rx: float,
    ry: float,
    start_degrees: float,
    end_degrees: float,
    samples: int = 18,
) -> list[tuple[float, float]]:
    return [
        (
            cx + rx * math.cos(math.radians(start_degrees + (end_degrees - start_degrees) * index / samples)),
            cy + ry * math.sin(math.radians(start_degrees + (end_degrees - start_degrees) * index / samples)),
        )
        for index in range(samples + 1)
    ]


def quadratic_points(
    start: tuple[float, float],
    control: tuple[float, float],
    end: tuple[float, float],
    samples: int = 12,
) -> list[tuple[float, float]]:
    result = []
    for index in range(samples + 1):
        t = index / samples
        mt = 1 - t
        result.append((
            mt * mt * start[0] + 2 * mt * t * control[0] + t * t * end[0],
            mt * mt * start[1] + 2 * mt * t * control[1] + t * t * end[1],
        ))
    return result


def cubic_points(
    start: tuple[float, float],
    control_a: tuple[float, float],
    control_b: tuple[float, float],
    end: tuple[float, float],
    samples: int = 14,
) -> list[tuple[float, float]]:
    result = []
    for index in range(samples + 1):
        t = index / samples
        mt = 1 - t
        result.append((
            mt ** 3 * start[0]
            + 3 * mt * mt * t * control_a[0]
            + 3 * mt * t * t * control_b[0]
            + t ** 3 * end[0],
            mt ** 3 * start[1]
            + 3 * mt * mt * t * control_a[1]
            + 3 * mt * t * t * control_b[1]
            + t ** 3 * end[1],
        ))
    return result


def s_stroke(pen, width: float, height: float, thickness: float, y_offset: float = 0) -> None:
    # A three-curve spine keeps S/s smooth at both text and display sizes.
    # The former ten-point polyline introduced visible corners and made the
    # family read as an illustrated alphabet instead of a professional sans.
    top_start = (width * .82, y_offset + height * .84)
    upper_end = (width * .20, y_offset + height * .69)
    middle_end = (width * .79, y_offset + height * .31)
    bottom_end = (width * .18, y_offset + height * .14)
    points = cubic_points(
        top_start,
        (width * .67, y_offset + height * 1.02),
        (width * .24, y_offset + height * 1.02),
        upper_end,
        12,
    )
    points += cubic_points(
        upper_end,
        (width * .13, y_offset + height * .49),
        (width * .84, y_offset + height * .56),
        middle_end,
        15,
    )[1:]
    points += cubic_points(
        middle_end,
        (width * .75, y_offset + height * .03),
        (width * .33, y_offset - height * .02),
        bottom_end,
        12,
    )[1:]
    stroke_polyline(pen, points, thickness, round_caps=True)


def advance_for(character: str, design: Design) -> int:
    base = character
    if unicodedata.normalize("NFD", character):
        base = unicodedata.normalize("NFD", character)[0]
    if character in SPECIAL_LATIN_WIDTHS:
        width = SPECIAL_LATIN_WIDTHS[character]
    elif character.isspace():
        width = 300
    elif base in "ilI.,:;!'`|":
        width = 300
    elif base in "fj":
        width = 430
    elif base in "rt":
        width = 470
    elif base in "()[]{}":
        width = 390
    elif base in "mwMW@%&":
        width = 820
    elif base in "ABCDEFGHJKLMNOPQRSTUVWXYZ":
        width = 690
    elif base in "0123456789":
        width = 620
    else:
        # The complete-family prototype used one 555-unit advance for nearly
        # every lowercase letter. That made the hand-drawn core collide at
        # display weights and forced CSS tracking to hide a font-metric bug.
        # These advances follow the explicit manual control drawings and keep
        # their proportions stable as the weight/optical axes change.
        width = {
            "a": 606, "b": 636, "c": 584, "d": 610, "e": 616,
            "f": 472, "g": 610, "h": 632, "i": 252, "j": 300,
            "k": 590, "l": 252, "m": 820, "n": 632, "o": 624,
            "p": 636, "q": 610, "r": 492, "s": 584, "t": 498,
            "u": 632, "v": 590, "w": 820, "x": 590, "y": 590,
            "z": 560,
        }.get(base, 555)
    optical = (design.optical_size - 14) / 58
    weight = (design.weight - 300) / 600
    width *= 1 - 0.045 * optical + 0.025 * weight
    if design.italic:
        width += 12
    return round(width)


def draw_upper(pen, character: str, width: float, d: Design) -> None:
    if d.weight >= 600 and draw_manual_core(pen, character, width, d, MANUAL_UPPER_CORE):
        return
    s, cap, side = d.stem, d.cap, d.side
    left, right = side, width - side
    mid = width / 2
    if character == "A":
        stroke_polyline(pen, [(left, 0), (mid, cap), (right, 0)], s)
        rect(pen, left + s * .55, cap * .32, right - s * .55, cap * .32 + s * .72)
    elif character == "B":
        rect(pen, left, 0, left + s, cap)
        ring(pen, left + s * .45, cap * .47, right, cap, s * .88)
        ring(pen, left + s * .45, 0, right, cap * .53, s * .92)
    elif character == "C":
        stroke_polyline(pen, sampled_arc(mid, cap / 2, (right-left)/2, cap/2, 42, 318), s)
    elif character == "D":
        rect(pen, left, 0, left + s, cap)
        ring(pen, left + s * .42, 0, right, cap, s)
    elif character == "E":
        rect(pen, left, 0, left + s, cap)
        rect(pen, left, cap - s, right, cap)
        rect(pen, left, cap * .47 - s/2, right * .88, cap * .47 + s/2)
        rect(pen, left, 0, right, s)
    elif character == "F":
        rect(pen, left, 0, left + s, cap)
        rect(pen, left, cap - s, right, cap)
        rect(pen, left, cap * .48 - s/2, right * .86, cap * .48 + s/2)
    elif character == "G":
        stroke_polyline(pen, sampled_arc(mid, cap / 2, (right-left)/2, cap/2, 42, 318), s)
        rect(pen, mid, cap * .35, right, cap * .35 + s)
        rect(pen, right - s, 0, right, cap * .36 + s)
    elif character == "H":
        rect(pen, left, 0, left + s, cap)
        rect(pen, right - s, 0, right, cap)
        rect(pen, left, cap * .47 - s/2, right, cap * .47 + s/2)
    elif character == "I":
        rect(pen, mid - s/2, 0, mid + s/2, cap)
        rect(pen, left, cap - s * .7, right, cap)
        rect(pen, left, 0, right, s * .7)
    elif character == "J":
        rect(pen, right - s, cap * .18, right, cap)
        stroke_polyline(pen, sampled_arc(mid, cap * .18, (right-left)/2, cap*.18, 180, 360, 10), s)
    elif character == "K":
        rect(pen, left, 0, left + s, cap)
        stroke_polyline(pen, [(left + s*.7, cap*.43), (right, cap)], s)
        stroke_polyline(pen, [(left + s*.7, cap*.43), (right, 0)], s)
    elif character == "L":
        rect(pen, left, 0, left + s, cap)
        rect(pen, left, 0, right, s)
    elif character == "M":
        rect(pen, left, 0, left + s, cap)
        rect(pen, right - s, 0, right, cap)
        stroke_polyline(pen, [(left + s*.65, cap), (mid, cap*.34), (right - s*.65, cap)], s*.88)
    elif character == "N":
        rect(pen, left, 0, left + s, cap)
        rect(pen, right - s, 0, right, cap)
        stroke_polyline(pen, [(left + s*.55, cap), (right - s*.55, 0)], s)
    elif character == "O":
        ring(pen, left, 0, right, cap, s)
    elif character == "P":
        rect(pen, left, 0, left + s, cap)
        ring(pen, left + s*.44, cap*.43, right, cap, s*.94)
    elif character == "Q":
        ring(pen, left, 0, right, cap, s)
        stroke_polyline(pen, [(mid + s*.2, cap*.20), (right + s*.18, -s*.28)], s*.7)
    elif character == "R":
        rect(pen, left, 0, left + s, cap)
        ring(pen, left + s*.44, cap*.43, right, cap, s*.94)
        stroke_polyline(pen, [(mid, cap*.43), (right, 0)], s)
    elif character == "S":
        s_stroke(pen, width, cap, s)
    elif character == "T":
        rect(pen, left, cap - s, right, cap)
        rect(pen, mid - s/2, 0, mid + s/2, cap)
    elif character == "U":
        points = [(left + s/2, cap), (left + s/2, cap*.22)]
        points += sampled_arc(mid, cap*.22, (right-left-s)/2, cap*.22, 180, 360, 12)[1:]
        points += [(right - s/2, cap)]
        stroke_polyline(pen, points, s)
    elif character == "V":
        stroke_polyline(pen, [(left, cap), (mid, 0), (right, cap)], s)
    elif character == "W":
        stroke_polyline(pen, [(left, cap), (width*.28, 0), (mid, cap*.56), (width*.72, 0), (right, cap)], s)
    elif character == "X":
        stroke_polyline(pen, [(left, cap), (right, 0)], s)
        stroke_polyline(pen, [(right, cap), (left, 0)], s)
    elif character == "Y":
        stroke_polyline(pen, [(left, cap), (mid, cap*.48), (right, cap)], s)
        rect(pen, mid - s/2, 0, mid + s/2, cap*.5)
    elif character == "Z":
        rect(pen, left, cap - s, right, cap)
        stroke_polyline(pen, [(right - s*.2, cap - s*.4), (left + s*.2, s*.4)], s)
        rect(pen, left, 0, right, s)


def draw_lower(pen, character: str, width: float, d: Design) -> None:
    if d.weight >= 600 and draw_manual_core(pen, character, width, d, MANUAL_LOWER_CORE):
        return
    s, xh, side = d.stem * .92, d.x_height, d.side
    left, right = side, width - side
    mid = width / 2
    desc = -210
    if character == "a":
        ring(pen, left, 0, right - s*.28, xh, s)
        rect(pen, right - s, 0, right, xh)
        if d.italic:
            stroke_polyline(pen, [(left - s*.15, xh*.12), (left + s*.35, 0)], s*.35)
    elif character in "bdpq":
        if character in "bd":
            stem_x = left if character == "b" else right - s
            rect(pen, stem_x, 0, stem_x + s, d.cap)
            bowl_left = left + s*.42 if character == "b" else left
            bowl_right = right if character == "b" else right - s*.42
            ring(pen, bowl_left, 0, bowl_right, xh, s)
        else:
            stem_x = left if character == "p" else right - s
            rect(pen, stem_x, desc, stem_x + s, xh)
            bowl_left = left + s*.42 if character == "p" else left
            bowl_right = right if character == "p" else right - s*.42
            ring(pen, bowl_left, 0, bowl_right, xh, s)
    elif character == "c":
        stroke_polyline(pen, sampled_arc(mid, xh/2, (right-left)/2, xh/2, 42, 318), s)
    elif character == "e":
        # Keep the eye open and the terminal unmistakably separate from the
        # crossbar.  The previous almost-closed arc read as a damaged `o` at
        # display weights and made words such as "certificada" lose rhythm.
        stroke_polyline(
            pen,
            sampled_arc(mid, xh / 2, (right - left) / 2, xh / 2, 48, 318, 22),
            s,
            True,
        )
        rect(
            pen,
            left + s * .58,
            xh * .47 - s * .24,
            right - s * .12,
            xh * .47 + s * .24,
        )
    elif character == "f":
        # A restrained ascender replaces the former circular hook.  It keeps
        # the family round without turning `f` into a decorative loop.
        stem_x = mid - s * .22
        hook = [(stem_x, -s * .04), (stem_x, xh * .70)]
        hook += cubic_points(
            (stem_x, xh * .70),
            (stem_x, d.cap * .94),
            (right - s * .30, d.cap * .96),
            (right - s * .12, d.cap * .76),
            16,
        )[1:]
        stroke_polyline(pen, hook, s, True)
        rect(
            pen,
            left,
            xh * .58 - s * .31,
            right - s * .10,
            xh * .58 + s * .31,
        )
    elif character == "g":
        ring(pen, left, 0, right - s*.28, xh, s)
        rect(pen, right - s, desc*.55, right, xh)
        hook = sampled_arc(mid, desc*.54, (right-left)/2, abs(desc)*.46, 10, 195, 12)
        stroke_polyline(pen, hook, s)
    elif character == "h":
        rect(pen, left, 0, left + s, d.cap)
        arch_start = left + s * .45
        arch_end = right - s * .45
        arch = sampled_arc(
            (arch_start + arch_end) / 2,
            xh * .50,
            max(s * .75, (arch_end - arch_start) / 2),
            xh * .50,
            180,
            0,
            18,
        )
        stroke_polyline(pen, arch, s)
        rect(pen, right - s, 0, right, xh * .52)
    elif character in "ij":
        stem_x = mid - s/2
        rect(pen, stem_x, desc if character == "j" else 0, stem_x + s, xh*.72)
        ellipse(pen, mid - s*.55, xh*.88, mid + s*.55, xh*.88 + s*1.1)
        if character == "j":
            stroke_polyline(pen, sampled_arc(mid-s*.25, desc, s*.9, s*.72, 185, 345, 9), s*.72)
    elif character == "k":
        rect(pen, left, 0, left + s, d.cap)
        stroke_polyline(pen, [(left+s*.5, xh*.40), (right, xh)], s)
        stroke_polyline(pen, [(left+s*.5, xh*.40), (right, 0)], s)
    elif character == "l":
        rect(pen, mid - s/2, 0, mid + s/2, d.cap)
        rect(pen, mid - s/2, 0, right - s*.12, s*.56)
    elif character in "mn":
        columns = 2 if character == "m" else 1
        rect(pen, left, 0, left + s, xh)
        # Enter the stem instead of merely touching its edge. Exact tangencies
        # can split after italic shear and overlap removal at intermediate
        # weights, which is both a topology and rasterisation defect.
        start = left + s * .45
        available = right - start
        cell = available / columns
        for index in range(columns):
            x0 = start + cell * index
            x1 = start + cell * (index + 1)
            arch_end = x1 - s * .45
            arch = sampled_arc(
                (x0 + arch_end) / 2,
                xh * .50,
                max(s * .62, (arch_end - x0) / 2),
                xh * .50,
                180,
                0,
                18,
            )
            stroke_polyline(pen, arch, s)
            rect(pen, x1 - s, 0, x1, xh * .52)
    elif character == "o":
        ring(pen, left, 0, right, xh, s)
    elif character == "r":
        rect(pen, left, 0, left + s, xh)
        shoulder = cubic_points(
            (left + s * .55, xh * .58),
            (left + s * .95, xh * .96),
            (right - s * .30, xh * .94),
            (right - s * .10, xh * .58),
            18,
        )
        stroke_polyline(pen, shoulder, s, True)
    elif character == "s":
        s_stroke(pen, width, xh, s)
    elif character == "t":
        stem = [(mid, d.cap * .82), (mid, s * .72)]
        stem += quadratic_points(
            (mid, s * .72),
            (mid + s * .10, 0),
            (right - s * .12, s * .16),
            10,
        )[1:]
        stroke_polyline(pen, stem, s, True)
        rect(pen, left, xh * .61 - s * .31, right - s * .04, xh * .61 + s * .31)
    elif character == "u":
        points = [(left+s/2, xh), (left+s/2, xh*.28)]
        points += sampled_arc(mid, xh*.27, (right-left-s)/2, xh*.27, 180, 360, 12)[1:]
        points += [(right-s/2, xh)]
        stroke_polyline(pen, points, s)
        rect(pen, right-s, 0, right, xh)
    elif character == "v":
        stroke_polyline(pen, [(left, xh), (mid, 0), (right, xh)], s)
    elif character == "w":
        stroke_polyline(pen, [(left, xh), (width*.29, 0), (mid, xh*.50), (width*.71, 0), (right, xh)], s)
    elif character == "x":
        stroke_polyline(pen, [(left, xh), (right, 0)], s)
        stroke_polyline(pen, [(right, xh), (left, 0)], s)
    elif character == "y":
        stroke_polyline(pen, [(left, xh), (mid, 0), (right, xh)], s)
        stroke_polyline(pen, [(mid, 0), (mid-s*.1, desc*.72), (left+s*.1, desc)], s*.84)
    elif character == "z":
        rect(pen, left, xh-s, right, xh)
        stroke_polyline(pen, [(right-s*.2, xh-s*.4), (left+s*.2, s*.4)], s)
        rect(pen, left, 0, right, s)


def draw_digit(pen, character: str, width: float, d: Design) -> None:
    s, cap, side = d.stem*.92, d.cap, d.side
    left, right, mid = side, width-side, width/2
    if character == "0":
        ring(pen, left, 0, right, cap, s)
    elif character == "1":
        rect(pen, mid-s/2, 0, mid+s/2, cap)
        stroke_polyline(pen, [(left+s*.3, cap*.76), (mid, cap)], s*.75)
        rect(pen, left+s*.2, 0, right-s*.2, s*.72)
    elif character == "2":
        # Display numerals use controlled terminals. Round caps at the joins
        # made the diagonal look hooked after overlap removal at heavy weights.
        stroke_polyline(pen, sampled_arc(mid, cap*.72, (right-left)/2, cap*.28, 176, -20, 12), s)
        stroke_polyline(pen, [(right-s*.25, cap*.53), (left+s*.2, s*.1)], s)
        rect(pen, left, 0, right, s)
    elif character == "3":
        # Both bowls open to the left. The beta originally traversed the top
        # arc through its lower half and made 3 read as a question mark.
        stroke_polyline(pen, sampled_arc(mid-s*.10, cap*.74, (right-left)*.46, cap*.25, 140, -140, 14), s)
        stroke_polyline(pen, sampled_arc(mid-s*.10, cap*.26, (right-left)*.46, cap*.25, 140, -140, 14), s)
    elif character == "4":
        stroke_polyline(pen, [(right-s*.72, cap), (left, cap*.28), (right, cap*.28)], s)
        rect(pen, right-s*1.2, 0, right-s*.2, cap)
    elif character == "5":
        rect(pen, left, cap-s, right, cap)
        rect(pen, left, cap*.48, left+s, cap)
        stroke_polyline(pen, sampled_arc(mid, cap*.25, (right-left)/2, cap*.25, 140, -140, 14), s)
    elif character == "6":
        stroke_polyline(pen, sampled_arc(mid, cap*.34, (right-left)/2, cap*.32, 0, 360, 18), s)
        stroke_polyline(pen, [(right-s*.4, cap*.95), (mid-s*.5, cap*.72), (left+s*.2, cap*.38)], s)
    elif character == "7":
        rect(pen, left, cap-s, right, cap)
        stroke_polyline(pen, [(right-s*.2, cap-s*.25), (mid-s*.25, 0)], s)
    elif character == "8":
        ring(pen, left+s*.12, cap*.47, right-s*.12, cap, s*.88)
        ring(pen, left, 0, right, cap*.55, s)
    elif character == "9":
        stroke_polyline(pen, sampled_arc(mid, cap*.66, (right-left)/2, cap*.32, 0, 360, 18), s)
        stroke_polyline(pen, [(left+s*.4, cap*.05), (mid+s*.5, cap*.28), (right-s*.2, cap*.62)], s)


def draw_mark(pen, name: str, d: Design) -> None:
    s = max(42, d.stem*.46)
    if name == "acutecomb":
        polygon(pen, [(-92, 0), (-34, 0), (78, 132), (5, 132)])
    elif name == "gravecomb":
        polygon(pen, [(-78, 132), (-5, 132), (92, 0), (34, 0)])
    elif name == "circumflexcomb":
        stroke_polyline(pen, [(-112, 0), (0, 112), (112, 0)], s*.72)
    elif name == "caroncomb":
        stroke_polyline(pen, [(-112, 112), (0, 0), (112, 112)], s*.72)
    elif name == "caron.alt":
        polygon(pen, [(-18, 124), (48, 124), (10, -34), (-42, -34)])
    elif name == "tildecomb":
        stroke_polyline(pen, [(-122, 35), (-70, 76), (-12, 76), (42, 30), (104, 30), (132, 62)], s*.48, True)
    elif name == "macroncomb":
        rect(pen, -112, 34, 112, 34+s*.62)
    elif name == "brevecomb":
        stroke_polyline(pen, sampled_arc(0, 100, 106, 78, 200, 340, 10), s*.58, True)
    elif name == "dotaccentcomb":
        ellipse(pen, -s*.52, 28, s*.52, 28+s*1.04)
    elif name == "dieresiscomb":
        ellipse(pen, -92-s*.42, 28, -92+s*.42, 28+s*.84)
        ellipse(pen, 92-s*.42, 28, 92+s*.42, 28+s*.84)
    elif name == "ringcomb":
        ring(pen, -72, 0, 72, 144, s*.38)
    elif name == "hungarumlautcomb":
        polygon(pen, [(-130, 0), (-82, 0), (-8, 132), (-70, 132)])
        polygon(pen, [(10, 0), (58, 0), (132, 132), (70, 132)])
    elif name == "cedillacomb":
        stroke_polyline(pen, [(0, 40), (-18, -44), (52, -74), (10, -150), (-62, -128)], s*.62, True)
    elif name == "ogonekcomb":
        stroke_polyline(pen, [(42, 30), (2, -44), (12, -124), (82, -148)], s*.66, True)


def draw_punctuation(pen, character: str, width: float, d: Design) -> None:
    s, cap, xh, side, mid = d.stem, d.cap, d.x_height, d.side, width/2
    dot = max(68, s*.78)
    if character in "¡¿":
        reflected = TransformPen(pen, (1, 0, 0, -1, 0, d.cap))
        draw_punctuation(reflected, "!" if character == "¡" else "?", width, d)
    elif character in ".·•":
        size = dot * (1.45 if character == "•" else 1)
        ellipse(pen, mid-size/2, 0 if character != "·" else xh*.42, mid+size/2, (0 if character != "·" else xh*.42)+size)
    elif character == ",":
        ellipse(pen, mid-dot/2, 0, mid+dot/2, dot)
        polygon(pen, [(mid, dot*.2), (mid+dot*.28, dot*.2), (mid-dot*.18, -dot*.92)])
    elif character in ":;":
        ellipse(pen, mid-dot/2, xh*.62, mid+dot/2, xh*.62+dot)
        draw_punctuation(pen, "," if character == ";" else ".", width, d)
    elif character == "*":
        for angle in (0, 60, 120):
            dx = math.cos(math.radians(angle))*width*.26
            dy = math.sin(math.radians(angle))*xh*.26
            stroke_polyline(pen, [(mid-dx, xh*.54-dy), (mid+dx, xh*.54+dy)], s*.42)
    elif character == "^":
        stroke_polyline(pen, [(side, xh*.48), (mid, xh*.86), (width-side, xh*.48)], s*.50)
    elif character == "~":
        stroke_polyline(pen, [(side, xh*.42), (width*.36, xh*.54), (width*.64, xh*.34), (width-side, xh*.47)], s*.42, True)
    elif character in "!?":
        question = character == "?"
        if question:
            top = sampled_arc(mid, xh*.72, width*.26, xh*.25, 165, -18, 12)
            stroke_polyline(pen, top + [(mid+s*.25, xh*.34), (mid, xh*.24)], s*.74, True)
        else:
            rect(pen, mid-s*.36, xh*.25, mid+s*.36, cap)
        ellipse(pen, mid-dot/2, 0, mid+dot/2, dot)
    elif character in "-–—_":
        lengths = {"-": .58, "–": .78, "—": .94, "_": .9}
        y = -28 if character == "_" else xh*.43
        half = width*lengths[character]/2
        rect(pen, mid-half, y, mid+half, y+s*.52)
    elif character in "/\\":
        if character == "/":
            stroke_polyline(pen, [(side, -80), (width-side, cap+70)], s*.58)
        else:
            stroke_polyline(pen, [(side, cap+70), (width-side, -80)], s*.58)
    elif character in "()[]{}":
        opening = character in "([{"
        x = mid + (s*.24 if opening else -s*.24)
        if character in "()":
            angles = (105, 255) if opening else (-75, 75)
            stroke_polyline(pen, sampled_arc(x, cap*.42, width*.34, cap*.60, *angles, 14), s*.55, True)
        elif character in "[]":
            edge = side if opening else width-side
            rect(pen, edge-s/2, -80, edge+s/2, cap+80)
            direction = 1 if opening else -1
            rect(pen, edge, cap+80-s*.5, edge+direction*width*.33, cap+80)
            rect(pen, edge, -80, edge+direction*width*.33, -80+s*.5)
        else:
            direction = 1 if opening else -1
            pts = [(x-direction*s, cap+70), (x, cap+70), (x, cap*.55), (x+direction*s*.8, cap*.42), (x, cap*.30), (x, -70), (x-direction*s, -70)]
            stroke_polyline(pen, pts, s*.52)
    elif character in "'’‘`´":
        if character in "`‘":
            polygon(pen, [(mid-55, cap), (mid+12, cap), (mid+70, cap-150), (mid+20, cap-150)])
        else:
            polygon(pen, [(mid+55, cap), (mid-12, cap), (mid-70, cap-150), (mid-20, cap-150)])
    elif character == "‚":
        polygon(pen, [(mid+55, 120), (mid-12, 120), (mid-70, -60), (mid-20, -60)])
    elif character in '\"“”„«»':
        offset = width*.18
        quote = "‘" if character in "“«" else "’"
        draw_punctuation(pen, quote, width-offset*1.35, d)
        transformed = TransformPen(pen, (1, 0, 0, 1, offset*1.35, 0 if character != "„" else -cap*.62))
        draw_punctuation(transformed, quote, width-offset*1.35, d)
    elif character == "|":
        rect(pen, mid-s*.3, -80, mid+s*.3, cap+80)
    elif character in "+=":
        rect(pen, side, xh*.42-s*.32, width-side, xh*.42+s*.32)
        if character == "+":
            rect(pen, mid-s*.32, xh*.12, mid+s*.32, xh*.72)
        else:
            rect(pen, side, xh*.18-s*.32, width-side, xh*.18+s*.32)
    elif character == "±":
        rect(pen, side, xh*.52-s*.30, width-side, xh*.52+s*.30)
        rect(pen, mid-s*.30, xh*.26, mid+s*.30, xh*.78)
        rect(pen, side, xh*.08, width-side, xh*.08+s*.46)
    elif character in "<>":
        direction = 1 if character == ">" else -1
        points = [(mid-direction*width*.28, xh*.76), (mid+direction*width*.28, xh*.40), (mid-direction*width*.28, xh*.04)]
        stroke_polyline(pen, points, s*.58)
    elif character == "#":
        rect(pen, width*.30-s*.3, 0, width*.30+s*.3, cap)
        rect(pen, width*.70-s*.3, 0, width*.70+s*.3, cap)
        rect(pen, side, cap*.34-s*.28, width-side, cap*.34+s*.28)
        rect(pen, side, cap*.66-s*.28, width-side, cap*.66+s*.28)
    elif character == "%":
        ring(pen, side, cap*.60, width*.42, cap, s*.42)
        ring(pen, width*.58, 0, width-side, cap*.40, s*.42)
        stroke_polyline(pen, [(side+s*.2, 0), (width-side-s*.2, cap)], s*.45)
    elif character == "@":
        ring(pen, side, 0, width-side, cap, s*.62)
        ring(pen, width*.32, cap*.22, width*.70, cap*.73, s*.48)
        rect(pen, width*.66, cap*.24, width*.66+s*.58, cap*.72)
    elif character == "&":
        ring(pen, side, cap*.45, width*.62, cap, s*.66)
        ring(pen, side, 0, width*.70, cap*.58, s*.66)
        stroke_polyline(pen, [(width*.42, cap*.48), (width-side, 0)], s*.68)
        stroke_polyline(pen, [(width*.40, cap*.34), (width-side, cap*.72)], s*.5)
    elif character in "$€£¥¢":
        if character == "$":
            s_stroke(pen, width, cap, s)
            rect(pen, mid-s*.24, -60, mid+s*.24, cap+60)
        elif character in "€¢":
            stroke_polyline(pen, sampled_arc(mid, cap/2, (width-2*side)/2, cap/2, 42, 318), s, True)
            rect(pen, side, cap*.40, width*.68, cap*.40+s*.42)
            rect(pen, side, cap*.58, width*.68, cap*.58+s*.42)
            if character == "¢":
                rect(pen, mid-s*.22, -40, mid+s*.22, cap+40)
        elif character == "£":
            stroke_polyline(pen, sampled_arc(mid, cap*.74, width*.25, cap*.24, 210, 20, 10), s*.72, True)
            rect(pen, mid-s*.45, 0, mid+s*.45, cap*.70)
            rect(pen, side, cap*.36, width*.72, cap*.36+s*.45)
            rect(pen, side, 0, width-side, s*.65)
        else:
            stroke_polyline(pen, [(side, cap), (mid, cap*.47), (width-side, cap)], s*.76)
            rect(pen, mid-s*.38, 0, mid+s*.38, cap*.50)
            rect(pen, side, cap*.28, width-side, cap*.28+s*.42)
            rect(pen, side, cap*.42, width-side, cap*.42+s*.42)
    elif character in "°":
        ring(pen, mid-90, cap-10, mid+90, cap+170, s*.38)
    elif character in "×÷":
        if character == "×":
            stroke_polyline(pen, [(side, xh*.72), (width-side, xh*.12)], s*.52)
            stroke_polyline(pen, [(width-side, xh*.72), (side, xh*.12)], s*.52)
        else:
            rect(pen, side, xh*.42-s*.28, width-side, xh*.42+s*.28)
            ellipse(pen, mid-dot*.42, xh*.72, mid+dot*.42, xh*.72+dot*.84)
            ellipse(pen, mid-dot*.42, xh*.02, mid+dot*.42, xh*.02+dot*.84)
    elif character in "←↑→↓↗↘":
        vectors = {"←":(-1,0), "→":(1,0), "↑":(0,1), "↓":(0,-1), "↗":(1,1), "↘":(1,-1)}
        dx, dy = vectors[character]
        start = (mid-dx*width*.30, xh*.40-dy*xh*.28)
        end = (mid+dx*width*.30, xh*.40+dy*xh*.28)
        stroke_polyline(pen, [start, end], s*.54)
        perp = (-dy, dx)
        head = (end[0]-dx*width*.18, end[1]-dy*xh*.18)
        stroke_polyline(pen, [(head[0]+perp[0]*width*.13, head[1]+perp[1]*xh*.13), end, (head[0]-perp[0]*width*.13, head[1]-perp[1]*xh*.13)], s*.54)
    elif character in "©®":
        ring(pen, side, 0, width-side, cap, s*.52)
        inner_width = width*.55
        transformed = TransformPen(pen, (.55,0,0,.55,width*.225,cap*.18))
        draw_upper(transformed, "C" if character == "©" else "R", inner_width/.55, Design(d.weight, d.optical_size, False))
    elif character == "™":
        transformed = TransformPen(pen, (.55,0,0,.55,side,cap*.45))
        draw_upper(transformed, "T", width*.72, Design(d.weight, d.optical_size, False))
        transformed2 = TransformPen(pen, (.55,0,0,.55,width*.38,cap*.45))
        draw_upper(transformed2, "M", width*.95, Design(d.weight, d.optical_size, False))
    elif character == "¤":
        ring(pen, mid-width*.22, cap*.26, mid+width*.22, cap*.74, s*.48)
        for start, end in (
            ((side, cap*.92), (mid-width*.18, cap*.70)),
            ((width-side, cap*.92), (mid+width*.18, cap*.70)),
            ((side, cap*.08), (mid-width*.18, cap*.30)),
            ((width-side, cap*.08), (mid+width*.18, cap*.30)),
        ):
            stroke_polyline(pen, [start, end], s*.42)
    elif character == "¦":
        rect(pen, mid-s*.28, cap*.58, mid+s*.28, cap+80)
        rect(pen, mid-s*.28, -80, mid+s*.28, cap*.34)
    elif character == "§":
        transformed = TransformPen(pen, (.78,0,0,.78,width*.11,cap*.22))
        s_stroke(transformed, width, cap, s)
        transformed2 = TransformPen(pen, (.78,0,0,.78,width*.11,-cap*.08))
        s_stroke(transformed2, width, cap, s)
    elif character in "¨¯´¸":
        mark_map = {"¨":"dieresiscomb", "¯":"macroncomb", "´":"acutecomb", "¸":"cedillacomb"}
        translated = TransformPen(pen, (1,0,0,1,mid,cap*.72 if character != "¸" else 0))
        draw_mark(translated, mark_map[character], d)
    elif character in "ªº":
        transformed = TransformPen(pen, (.58,0,0,.58,width*.19,cap*.42))
        draw_lower(transformed, "a" if character == "ª" else "o", width/.58, Design(d.weight, d.optical_size, d.italic))
        rect(pen, side, cap*.33, width-side, cap*.33+s*.34)
    elif character == "¬":
        rect(pen, side, xh*.50, width-side, xh*.50+s*.48)
        rect(pen, width-side-s*.48, xh*.27, width-side, xh*.52)
    elif character in "¹²³":
        base = {"¹":"1", "²":"2", "³":"3"}[character]
        transformed = TransformPen(pen, (.58,0,0,.58,width*.18,cap*.42))
        draw_digit(transformed, base, width/.58, Design(d.weight, d.optical_size, d.italic))
    elif character == "µ":
        mu_stem = d.stem * .92
        mu_left, mu_right = side, width - side
        rect(pen, mu_left, -160, mu_left + mu_stem, xh)
        rect(pen, mu_right - mu_stem, 0, mu_right, xh)
        mu_arc = sampled_arc(
            mid,
            xh * .27,
            (mu_right - mu_left - mu_stem) / 2,
            xh * .27,
            180,
            360,
            12,
        )
        stroke_polyline(pen, mu_arc, mu_stem, True)
    elif character == "¶":
        ring(pen, side, cap*.42, width*.62, cap, s*.62)
        rect(pen, width*.48, -80, width*.48+s*.72, cap)
        rect(pen, width*.68, -80, width*.68+s*.72, cap)
    elif character in "¼½¾":
        top, bottom = {"¼":("1","4"), "½":("1","2"), "¾":("3","4")}[character]
        top_pen = TransformPen(pen, (.45,0,0,.45,side,cap*.48))
        draw_digit(top_pen, top, width*.85, Design(d.weight, d.optical_size, d.italic))
        stroke_polyline(pen, [(width*.36, 0), (width*.64, cap)], s*.40)
        bottom_pen = TransformPen(pen, (.45,0,0,.45,width*.54,-10))
        draw_digit(bottom_pen, bottom, width*.85, Design(d.weight, d.optical_size, d.italic))
    elif character == "…":
        for x in (width*.24, width*.50, width*.76):
            ellipse(pen, x-dot/2, 0, x+dot/2, dot)


def draw_scaled_upper(
    pen,
    character: str,
    target_width: float,
    d: Design,
    x: float = 0,
    y: float = 0,
    scale_y: float = 1,
) -> None:
    source_width = advance_for(character, d)
    scale_x = target_width / source_width
    transformed = TransformPen(pen, (scale_x, 0, 0, scale_y, x, y))
    draw_upper(transformed, character, source_width, d)


def draw_scaled_lower(
    pen,
    character: str,
    target_width: float,
    d: Design,
    x: float = 0,
    y: float = 0,
    scale_y: float = 1,
) -> None:
    source_width = advance_for(character, d)
    scale_x = target_width / source_width
    transformed = TransformPen(pen, (scale_x, 0, 0, scale_y, x, y))
    draw_lower(transformed, character, source_width, d)


def draw_special_latin(pen, character: str, width: float, d: Design) -> None:
    """Draw the non-decomposable Latin characters required by the release gate.

    These are authored constructions from the UM Sans alphabet, not Unicode
    fallbacks. Ligatures and barred forms keep the same round terminals,
    counters and optical sidebearings as their source letters.
    """
    s, cap, xh, side = d.stem, d.cap, d.x_height, d.side
    mid = width / 2

    if character == "\u00ad":
        return
    if character == "Æ":
        draw_scaled_upper(pen, "A", width * .53, d, 0)
        draw_scaled_upper(pen, "E", width * .53, d, width * .45)
    elif character == "æ":
        draw_scaled_lower(pen, "a", width * .53, d, 0)
        draw_scaled_lower(pen, "e", width * .53, d, width * .45)
    elif character == "Œ":
        draw_scaled_upper(pen, "O", width * .54, d, 0)
        draw_scaled_upper(pen, "E", width * .54, d, width * .46)
    elif character == "œ":
        draw_scaled_lower(pen, "o", width * .54, d, 0)
        draw_scaled_lower(pen, "e", width * .54, d, width * .46)
    elif character == "Ĳ":
        draw_scaled_upper(pen, "I", width * .30, d, 0)
        draw_scaled_upper(pen, "J", width * .54, d, width * .38)
    elif character == "ĳ":
        draw_scaled_lower(pen, "i", width * .28, d, 0)
        draw_scaled_lower(pen, "j", width * .50, d, width * .40)
    elif character == "ß":
        # A horizontal long-s-plus-s construction keeps the eszett legible;
        # the earlier stacked construction created a decorative knot at bold
        # sizes instead of a usable alphabetic character.
        draw_scaled_lower(pen, "s", width * .52, d, 0, scale_y=cap / xh)
        draw_scaled_lower(pen, "s", width * .52, d, width * .43, scale_y=cap / xh)
    elif character == "ſ":
        draw_scaled_lower(pen, "s", width * .92, d, 0, scale_y=cap / xh)
    elif character == "ı":
        stem = d.stem * .92
        rect(pen, mid - stem / 2, 0, mid + stem / 2, xh * .72)
    elif character in {"Ð", "Ø", "Þ", "Đ", "Ħ", "Ŧ"}:
        source = {
            "Ð": "D", "Ø": "O", "Þ": "P", "Đ": "D", "Ħ": "H", "Ŧ": "T",
        }[character]
        draw_scaled_upper(pen, source, width * .96, d, 0)
        if character in {"Ð", "Đ"}:
            rect(pen, width * .14, cap * .45 - s * .24, width * .82, cap * .45 + s * .24)
        elif character == "Ø":
            stroke_polyline(pen, [(side + s * .2, -40), (width - side - s * .2, cap + 40)], s * .56)
        elif character == "Þ":
            rect(pen, width * .12, cap * .45 - s * .24, width * .86, cap * .45 + s * .24)
        elif character == "Ħ":
            rect(pen, width * .12, cap * .66 - s * .22, width * .86, cap * .66 + s * .22)
        else:  # Ŧ
            rect(pen, width * .18, cap * .50 - s * .22, width * .82, cap * .50 + s * .22)
    elif character in {"Ł", "Ŀ"}:
        draw_scaled_upper(pen, "L", width * .94, d, 0)
        if character == "Ł":
            stroke_polyline(pen, [(width * .16, cap * .08), (width * .83, cap * .82)], s * .56)
        else:
            ellipse(pen, width * .68, cap * .44, width * .68 + s * .78, cap * .44 + s * .78)
    elif character == "Ŋ":
        draw_scaled_upper(pen, "N", width * .90, d, 0)
        stroke_polyline(pen, [(width * .42, cap * .56), (width * .96, 0)], s * .76)
    elif character in {"đ", "ð", "þ", "ħ", "ŧ", "ł", "ŀ", "ŋ", "ø"}:
        source = {
            "đ": "d", "ð": "d", "þ": "p", "ħ": "h", "ŧ": "t",
            "ł": "l", "ŀ": "l", "ŋ": "n", "ø": "o",
        }[character]
        draw_scaled_lower(pen, source, width * .96, d, 0)
        if character in {"đ", "ð", "þ"}:
            rect(pen, width * .14, xh * .46 - s * .22, width * .82, xh * .46 + s * .22)
        elif character == "ħ":
            rect(pen, width * .14, xh * .62 - s * .20, width * .84, xh * .62 + s * .20)
        elif character == "ŧ":
            rect(pen, width * .18, xh * .56 - s * .20, width * .82, xh * .56 + s * .20)
        elif character == "ø":
            stroke_polyline(pen, [(side + s * .12, -28), (width - side - s * .12, xh + 28)], s * .52)
        elif character == "ł":
            stroke_polyline(pen, [(width * .18, xh * .08), (width * .82, xh * .74)], s * .50)
        elif character == "ŀ":
            ellipse(pen, width * .70, xh * .42, width * .70 + s * .72, xh * .42 + s * .72)
        else:  # ŋ
            stroke_polyline(pen, [(width * .58, xh * .36), (width * .94, -150)], s * .72, True)
    elif character == "ĸ":
        draw_scaled_lower(pen, "k", width * .96, d, 0)
    elif character == "ŉ":
        draw_scaled_lower(pen, "n", width * .94, d, 0)
        polygon(pen, [(width * .70, xh + 24), (width * .80, xh + 24), (width * .86, xh + 132), (width * .76, xh + 132)])


def draw_character(pen, character: str, width: int, d: Design) -> None:
    target_pen = pen
    if d.italic:
        target_pen = TransformPen(pen, (1, 0, d.shear, 1, -d.shear * 90, 0))
    if character in SPECIAL_LATIN_WIDTHS:
        draw_special_latin(target_pen, character, width, d)
    elif "A" <= character <= "Z":
        draw_upper(target_pen, character, width, d)
    elif "a" <= character <= "z":
        draw_lower(target_pen, character, width, d)
    elif "0" <= character <= "9":
        draw_digit(target_pen, character, width, d)
    elif character.isspace():
        return
    else:
        draw_punctuation(target_pen, character, width, d)


def composite_characters() -> dict[str, tuple[str, list[str]]]:
    result: dict[str, tuple[str, list[str]]] = {}
    for codepoint in range(0x00C0, 0x0180):
        character = chr(codepoint)
        decomposition = unicodedata.normalize("NFD", character)
        if len(decomposition) < 2 or decomposition[0] not in BASE_CHARS:
            continue
        marks = [COMBINING_MARKS.get(mark) for mark in decomposition[1:]]
        if marks and all(marks):
            result[character] = (decomposition[0], [mark for mark in marks if mark])
    return result


COMPOSITES = composite_characters()


def build_glyph_set(d: Design) -> tuple[list[str], dict[str, object], dict[str, tuple[int, int]], dict[int, str]]:
    glyphs: dict[str, object] = {}
    metrics: dict[str, tuple[int, int]] = {}
    cmap: dict[int, str] = {}
    order = [".notdef", ".null", "nonmarkingreturn"]

    def add_simple(name: str, width: int, draw) -> None:
        # Build the complete letter as a PathOps path before handing it to
        # FontTools.  Most glyphs combine several primitive shapes (stems,
        # bowls, diagonals and crossbars).  Writing those primitives directly
        # into a TrueType glyph leaves overlapping contours whose winding can
        # be interpreted as counters by different rasterizers.  Simplifying
        # the whole path here performs the union once, while retaining the
        # deliberately reversed contours used for counters.
        source_path = pathops.Path()
        draw(source_path.getPen())
        tt_pen = TTGlyphPen(glyphs)
        pen = Cu2QuPen(tt_pen, max_err=0.35, reverse_direction=False)
        if source_path:
            simplified = pathops.simplify(
                source_path,
                fix_winding=True,
                keep_starting_points=True,
                clockwise=True,
            )
            simplified.convertConicsToQuads(0.35)
            simplified.draw(pen)
        glyphs[name] = tt_pen.glyph()
        metrics[name] = (width, 0)
        if name not in order:
            order.append(name)

    add_simple(".notdef", 620, lambda pen: (rect(pen, 50, -60, 570, 760), rect(pen, 115, 5, 505, 695, True)))
    add_simple(".null", 0, lambda pen: None)
    add_simple("nonmarkingreturn", 0, lambda pen: None)

    characters = list(dict.fromkeys(BASE_CHARS))
    for character in characters:
        name = glyph_name(character)
        width = advance_for(character, d)
        add_simple(name, width, lambda pen, char=character, adv=width: draw_character(pen, char, adv, d))
        cmap[ord(character)] = name

    for combining, name in COMBINING_MARKS.items():
        add_simple(name, 0, lambda pen, mark_name=name: draw_mark(pen, mark_name, d))
        cmap[ord(combining)] = name
    add_simple("caron.alt", 0, lambda pen: draw_mark(pen, "caron.alt", d))

    for character, (base, marks) in COMPOSITES.items():
        name = glyph_name(character)
        base_name = glyph_name(base)
        width = metrics[base_name][0]
        pen = TTGlyphPen(glyphs)
        pen.addComponent(base_name, (1, 0, 0, 1, 0, 0))
        upper = base.isupper()
        top_y = (d.cap if upper else d.x_height) + (54 if upper else 48)
        bottom_y = -4
        for index, mark_name in enumerate(marks):
            component_name = "caron.alt" if character in "ďľťĎĽŤ" and mark_name == "caroncomb" else mark_name
            if component_name == "caron.alt":
                x, y = width - d.side*.70, (d.cap if upper else d.x_height)*.70
            else:
                x = width/2
                y = bottom_y if component_name in {"cedillacomb", "ogonekcomb"} else top_y + index * 112
            pen.addComponent(component_name, (1, 0, 0, 1, x, y))
        glyphs[name] = pen.glyph()
        metrics[name] = (width, 0)
        order.append(name)
        cmap[ord(character)] = name

    # Spanish and editorial alternates.
    slash_zero = "zero.slash"
    zero_name = glyph_name("0")
    pen = TTGlyphPen(glyphs)
    draw_digit(pen, "0", metrics[zero_name][0], d)
    stroke_polyline(pen, [(d.side+25, 30), (metrics[zero_name][0]-d.side-25, d.cap-30)], d.stem*.42)
    glyphs[slash_zero] = pen.glyph()
    metrics[slash_zero] = metrics[zero_name]
    order.append(slash_zero)

    for ligature, components in {"fi": ("f", "i"), "fl": ("f", "l")}.items():
        name = ligature
        left_name, right_name = (glyph_name(item) for item in components)
        left_width = metrics[left_name][0]
        right_width = metrics[right_name][0]
        pen = TTGlyphPen(glyphs)
        pen.addComponent(left_name, (1, 0, 0, 1, 0, 0))
        pen.addComponent(right_name, (1, 0, 0, 1, left_width*.62, 0))
        glyphs[name] = pen.glyph()
        metrics[name] = (round(left_width*.62+right_width), 0)
        order.append(name)

    return order, glyphs, metrics, cmap


def feature_source(order: list[str], metrics: dict[str, tuple[int, int]], d: Design) -> str:
    available = set(order)
    pairs = []
    weight_scale = .88 + (d.weight-300)/600*.20
    for (left_char, right_char), value in KERN_PAIRS.items():
        left = glyph_name(left_char)
        right = glyph_name(right_char)
        if left in available and right in available:
            pairs.append(f"  pos {left} {right} {round(value*weight_scale)};")
    top_bases = [glyph_name(char) for char in "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz" if glyph_name(char) in available]
    mark_classes = []
    for mark in ("acutecomb", "gravecomb", "circumflexcomb", "tildecomb", "macroncomb", "brevecomb", "dotaccentcomb", "dieresiscomb", "ringcomb", "hungarumlautcomb", "caroncomb"):
        if mark in available:
            mark_classes.append(f"markClass {mark} <anchor 0 0> @TOP_{mark};")
    mark_positions = []
    for base in top_bases:
        width = metrics[base][0]
        char = next((chr(cp) for cp, name in ((ord(c), glyph_name(c)) for c in BASE_CHARS) if name == base), "a")
        y = d.cap + 54 if char.isupper() else d.x_height + 48
        for mark in ("acutecomb", "gravecomb", "circumflexcomb", "tildecomb", "macroncomb", "brevecomb", "dotaccentcomb", "dieresiscomb", "ringcomb", "hungarumlautcomb", "caroncomb"):
            if mark in available:
                mark_positions.append(f"  pos base {base} <anchor {round(width/2)} {round(y)}> mark @TOP_{mark};")
    return "\n".join([
        "languagesystem DFLT dflt;",
        "languagesystem latn dflt;",
        "languagesystem latn ESP;",
        "feature liga { sub f i by fi; sub f l by fl; } liga;",
        "feature zero { sub zero by zero.slash; } zero;",
        "feature tnum { } tnum;",
        "feature kern {",
        *pairs,
        "} kern;",
        *mark_classes,
        "feature mark {",
        *mark_positions,
        "} mark;",
    ])


def strip_mac_name_records(font: TTFont) -> None:
    font["name"].names = [record for record in font["name"].names if record.platformID != 1]


def add_gasp(font: TTFont) -> None:
    gasp = newTable("gasp")
    gasp.version = 1
    gasp.gaspRange = {8: 0x000A, 65535: 0x000F}
    font["gasp"] = gasp
    prep = newTable("prep")
    prep.program = Program()
    prep.program.fromBytecode([0xB8, 0x01, 0xFF, 0x85, 0xB0, 0x04, 0x8D])
    font["prep"] = prep


def mark_overlap_flags(font: TTFont) -> None:
    """Tell variable-font rasterizers that compatible source contours overlap."""
    glyf = font["glyf"]
    for name in font.getGlyphOrder():
        glyph = glyf[name]
        if glyph.isComposite():
            if glyph.components:
                glyph.components[0].flags |= OVERLAP_COMPOUND
        elif glyph.numberOfContours > 0 and glyph.flags:
            glyph.flags[0] |= flagOverlapSimple


def make_font(
    d: Design,
    path: Path,
    family_name: str = FAMILY,
    style_name: str | None = None,
    cleanup_overlaps: bool = False,
) -> dict[str, object]:
    order, glyphs, metrics, cmap = build_glyph_set(d)
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENDER, descent=DESCENDER, lineGap=LINE_GAP)
    style = style_name or weight_name(d.weight, d.italic)
    full_name = f"{family_name} {style}"
    postscript_name = full_name.replace(" ", "-")
    fb.setupNameTable({
        "familyName": family_name,
        "styleName": style,
        "uniqueFontIdentifier": f"{VENDOR};{family_name};{VERSION};{style}",
        "fullName": full_name,
        "psName": postscript_name,
        "version": f"Version {VERSION}",
        "manufacturer": "ULTIMA MILLA S.A.",
        "designer": "UMSA Design Engineering",
        "description": DESCRIPTION,
        "vendorURL": "https://www.ultimamilla.com.ar",
        "designerURL": "https://www.ultimamilla.com.ar/estilo/um-sans",
        "licenseDescription": "Internal evaluation beta. Public licensing decision pending legal review.",
        "sampleText": "Fibra certificada, operación continua. ¿Qué alcance necesita su empresa?",
        "copyright": COPYRIGHT,
    })
    fb.setupOS2(
        sTypoAscender=ASCENDER,
        sTypoDescender=DESCENDER,
        sTypoLineGap=LINE_GAP,
        usWinAscent=980,
        usWinDescent=340,
        sxHeight=round(d.x_height),
        sCapHeight=round(d.cap),
        usWeightClass=d.weight,
        usWidthClass=5,
        fsSelection=(0x01 if d.italic else 0) | (0x20 if d.weight >= 700 else 0) | (0x40 if d.weight == 400 and not d.italic else 0),
        achVendID=VENDOR,
        fsType=0,
        ulUnicodeRange1=0xE00002FF,
        ulCodePageRange1=0x2000019F,
    )
    fb.setupPost(italicAngle=-10.5 if d.italic else 0, underlinePosition=-110, underlineThickness=52)
    fb.setupMaxp()
    font = fb.font
    font["head"].created = BUILD_EPOCH
    font["head"].modified = BUILD_EPOCH
    font["head"].fontRevision = 2.0
    font["head"].macStyle = (0x01 if d.weight >= 700 else 0) | (0x02 if d.italic else 0)
    strip_mac_name_records(font)
    add_gasp(font)
    addOpenTypeFeaturesFromString(font, feature_source(order, metrics, d))
    mark_overlap_flags(font)
    if cleanup_overlaps:
        # Static exports can be boolean-unioned without breaking interpolation.
        # Variable masters retain compatible contours and carry the OpenType
        # overlap flags required by conforming rasterizers.
        removeOverlaps(font, removeHinting=True, ignoreErrors=False)
    path.parent.mkdir(parents=True, exist_ok=True)
    font.save(path, reorderTables=False)
    return {
        "path": str(path.relative_to(ROOT) if path.is_relative_to(ROOT) else path),
        "weight": d.weight,
        "opticalSize": d.optical_size,
        "italic": d.italic,
        "glyphs": len(order),
        "characters": len(cmap),
    }


def weight_name(weight: int, italic: bool = False) -> str:
    base = dict(WEIGHTS).get(weight, str(weight))
    if italic:
        return "Italic" if weight == 400 else f"{base} Italic"
    return base


def save_ufo(d: Design, path: Path) -> None:
    order, _, metrics, cmap = build_glyph_set(d)
    font = UFOFont()
    font.info.familyName = FAMILY
    font.info.styleName = f"{weight_name(d.weight, d.italic)} {'Text' if d.optical_size == 14 else 'Display'}"
    font.info.unitsPerEm = UPM
    font.info.ascender = ASCENDER
    font.info.descender = DESCENDER
    font.info.capHeight = d.cap
    font.info.xHeight = d.x_height
    font.info.openTypeOS2WeightClass = d.weight
    font.info.italicAngle = -10.5 if d.italic else 0
    font.info.copyright = COPYRIGHT
    font.info.note = DESCRIPTION
    reverse_cmap = {name: cp for cp, name in cmap.items()}
    composites_by_name = {glyph_name(char): (char, value) for char, value in COMPOSITES.items()}
    for name in order:
        glyph = font.newGlyph(name)
        glyph.width = metrics[name][0]
        if name in reverse_cmap:
            glyph.unicodes = [reverse_cmap[name]]
        pen = glyph.getPen()
        if name == ".notdef":
            rect(pen, 50, -60, 570, 760)
            rect(pen, 115, 5, 505, 695, True)
        elif name in {".null", "nonmarkingreturn"}:
            pass
        elif name in {*COMBINING_MARKS.values(), "caron.alt"}:
            draw_mark(pen, name, d)
        elif name in composites_by_name:
            _, (base, marks) = composites_by_name[name]
            base_name = glyph_name(base)
            pen.addComponent(base_name, (1, 0, 0, 1, 0, 0))
            upper = base.isupper()
            top_y = (d.cap if upper else d.x_height) + (54 if upper else 48)
            for index, mark_name in enumerate(marks):
                component_name = "caron.alt" if name in {glyph_name(c) for c in "ďľťĎĽŤ"} and mark_name == "caroncomb" else mark_name
                if component_name == "caron.alt":
                    x, y = metrics[base_name][0] - d.side*.70, (d.cap if upper else d.x_height)*.70
                else:
                    x = metrics[base_name][0]/2
                    y = -4 if component_name in {"cedillacomb", "ogonekcomb"} else top_y + index*112
                pen.addComponent(component_name, (1, 0, 0, 1, x, y))
        elif name == "zero.slash":
            draw_digit(pen, "0", metrics[glyph_name("0")][0], d)
            stroke_polyline(pen, [(d.side+25, 30), (metrics[glyph_name('0')][0]-d.side-25, d.cap-30)], d.stem*.42)
        elif name in {"fi", "fl"}:
            first, second = ("f", name[1])
            left_width = metrics[glyph_name(first)][0]
            pen.addComponent(glyph_name(first), (1,0,0,1,0,0))
            pen.addComponent(glyph_name(second), (1,0,0,1,left_width*.62,0))
        else:
            character = next((chr(cp) for cp, glyph_name_value in cmap.items() if glyph_name_value == name), None)
            if character:
                draw_character(pen, character, metrics[name][0], d)
    font.glyphOrder = order
    font.features.text = feature_source(order, metrics, d)
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        shutil.rmtree(path)
    font.save(path, formatVersion=3)


def build_designspace(italic: bool, masters: list[tuple[Design, Path]], path: Path) -> None:
    document = DesignSpaceDocument()
    weight_axis = AxisDescriptor()
    weight_axis.name = "Weight"
    weight_axis.tag = "wght"
    weight_axis.minimum = 300
    weight_axis.default = 400
    weight_axis.maximum = 900
    document.addAxis(weight_axis)
    optical_axis = AxisDescriptor()
    optical_axis.name = "Optical Size"
    optical_axis.tag = "opsz"
    optical_axis.minimum = 14
    optical_axis.default = 18
    optical_axis.maximum = 72
    document.addAxis(optical_axis)
    for d, master_path in masters:
        source = SourceDescriptor()
        source.path = str(master_path)
        source.name = f"master.{d.weight}.{d.optical_size}.{'italic' if italic else 'roman'}"
        source.familyName = FAMILY
        source.styleName = f"{weight_name(d.weight, italic)} {'Text' if d.optical_size == 14 else 'Display'}"
        source.location = {"Weight": d.weight, "Optical Size": d.optical_size}
        if d.weight == 400 and d.optical_size == 18:
            source.copyLib = True
            source.copyInfo = True
            source.copyFeatures = True
        document.addSource(source)
    for weight, name in WEIGHTS:
        for optical, optical_name in ((14, "Text"), (32, "Display"), (72, "Poster")):
            instance = InstanceDescriptor()
            instance.name = f"{name} {optical_name}{' Italic' if italic else ''}"
            instance.familyName = FAMILY
            instance.styleName = instance.name
            instance.location = {"Weight": weight, "Optical Size": optical}
            document.addInstance(instance)
    path.parent.mkdir(parents=True, exist_ok=True)
    document.write(path)


def write_woff2(ttf_path: Path, output_path: Path) -> None:
    font = TTFont(ttf_path)
    font.flavor = "woff2"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    font.save(output_path, reorderTables=False)


def autohint_ttf(path: Path) -> None:
    """Add deterministic TrueType instructions before web packaging."""
    hinted = ttfautohint(in_buffer=path.read_bytes(), **HINTING_POLICY)
    path.write_bytes(hinted)
    font = TTFont(path, recalcBBoxes=False, recalcTimestamp=False)
    font["head"].created = BUILD_EPOCH
    font["head"].modified = BUILD_EPOCH
    font["head"].fontRevision = 2.0
    strip_mac_name_records(font)
    font.save(path, reorderTables=False)


def write_otf(
    ttf_path: Path,
    output_path: Path,
    d: Design,
    family_name: str = FAMILY,
) -> None:
    source = TTFont(ttf_path)
    glyph_order = source.getGlyphOrder()
    source_glyphs = source.getGlyphSet()
    metrics = source["hmtx"].metrics
    charstrings = {}
    for name in glyph_order:
        width = metrics[name][0]
        type2_pen = T2CharStringPen(width, source_glyphs)
        cubic_pen = Qu2CuPen(type2_pen, max_err=1.0, all_cubic=False)
        source_glyphs[name].draw(cubic_pen)
        charstrings[name] = type2_pen.getCharString(private=None, globalSubrs=None)
    style = weight_name(d.weight, d.italic)
    ps_family = family_name.replace(" ", "")
    ps_name = f"{ps_family}-{style.replace(' ', '')}"
    builder = FontBuilder(UPM, isTTF=False)
    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(source.getBestCmap())
    builder.setupHorizontalMetrics(metrics)
    builder.setupHorizontalHeader(ascent=ASCENDER, descent=DESCENDER, lineGap=LINE_GAP)
    builder.setupCFF(
        ps_name,
        {
            "version": VERSION,
            "FullName": f"{FAMILY} {style}",
            "FamilyName": FAMILY,
            "Weight": style,
            "ItalicAngle": -10.5 if d.italic else 0,
            "Notice": COPYRIGHT,
        },
        charstrings,
        {},
    )
    builder.setupNameTable({
        "familyName": family_name,
        "styleName": style,
        "uniqueFontIdentifier": f"{VENDOR};{family_name};{VERSION};{style};CFF",
        "fullName": f"{family_name} {style}",
        "psName": ps_name,
        "version": f"Version {VERSION}",
        "manufacturer": "ULTIMA MILLA S.A.",
        "designer": "UMSA Design Engineering",
        "description": DESCRIPTION,
        "licenseDescription": "Internal evaluation beta. Public licensing decision pending legal review.",
        "copyright": COPYRIGHT,
    })
    builder.setupOS2(
        sTypoAscender=ASCENDER,
        sTypoDescender=DESCENDER,
        sTypoLineGap=LINE_GAP,
        usWinAscent=980,
        usWinDescent=340,
        usWeightClass=d.weight,
        usWidthClass=5,
        sxHeight=round(d.x_height),
        sCapHeight=round(d.cap),
        achVendID=VENDOR,
        fsType=0,
        fsSelection=(0x01 if d.italic else 0) | (0x20 if d.weight >= 700 else 0) | (0x40 if d.weight == 400 and not d.italic else 0),
    )
    builder.setupPost(italicAngle=-10.5 if d.italic else 0, underlinePosition=-110, underlineThickness=52)
    builder.setupMaxp()
    for table in ("GDEF", "GPOS", "GSUB"):
        if table in source:
            builder.font[table] = deepcopy(source[table])
    builder.font["head"].created = BUILD_EPOCH
    builder.font["head"].modified = BUILD_EPOCH
    builder.font["head"].fontRevision = 2.0
    builder.font["head"].macStyle = (0x01 if d.weight >= 700 else 0) | (0x02 if d.italic else 0)
    strip_mac_name_records(builder.font)
    builder.font.save(output_path, reorderTables=False)


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def write_docs(report: dict[str, object]) -> None:
    provenance = {
        "family": FAMILY,
        "version": VERSION_LABEL,
        "status": "candidate - not production",
        "visualStatus": "blocked: roman core improved; italic topology, multiscale review and independent sign-off remain pending",
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "outlineOrigin": "UMSA-authored geometric primitives in scripts/fonts/build_um_sans_2.py",
        "upstreamOutlineDependencies": [],
        "outlineCleanup": "Boolean union with FontTools removeOverlaps + skia-pathops before every TTF export",
        "reviewBoundary": [
            "roman core is a local candidate and still requires word, paragraph and responsive sign-off",
            "heavy italic topology requires correction or explicit acceptance",
            "independent contour similarity review pending",
            "trademark clearance pending",
            "signed chain of title pending",
            "physical platform matrix pending",
        ],
        "designspaceAxes": {"wght": [300, 900], "opsz": [14, 72]},
        "variableExport": {
            "status": "blocked",
            "reason": "Boolean-cleaned masters are not yet contour-compatible. No variable binary is distributed.",
        },
        "report": report,
    }
    (OUTPUT / "provenance.json").write_text(json.dumps(provenance, ensure_ascii=False, indent=2) + "\n")
    license_text = """UM Sans 2.1 — candidate evaluation notice\n\nCopyright 2026 ULTIMA MILLA S.A.\n\nThis candidate is retained for local specimen and engineering review only. It is not approved for redistribution, resale or production deployment. Heavy italics, multiscale visual review, independent similarity, legal and platform reviews remain open.\n"""
    (OUTPUT / "EVALUATION-LICENSE.txt").write_text(license_text)
    source_readme = """# UM Sans 2.1 candidate sources\n\nThese UFO masters, designspaces and feature sources are generated exclusively from the geometric constructions in `scripts/fonts/build_um_sans_2.py`. The builder does not open, subset or transform Inter or another font.\n\nThe output is a local candidate, not a release. The roman core is ready for controlled visual review; heavy italics, multiscale proofs, similarity, legal and platform sign-off remain open. No binary is approved for production or redistribution.\n"""
    (SOURCE_OUTPUT / "README.md").write_text(source_readme)


def write_standalone_specimen() -> None:
    rows = []
    for weight, style in WEIGHTS:
        rows.append(
            f"<article><span>{weight}</span><div><strong style=\"font-weight:{weight}\">Operación continua, evidencia visible.</strong>"
            f"<em style=\"font-weight:{weight}\">Infraestructura crítica, decisión humana.</em></div></article>"
        )
    html = """<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>UM Sans 2 — Candidate visual QA</title>
<style>
:root{--red:#dc2626;--ink:#101114;--muted:#60666e;--line:#dfe2e5;--paper:#fff;--black:#08090a}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,system-ui,sans-serif;font-size:18px;line-height:1.55;font-synthesis:none;-webkit-font-smoothing:antialiased}
.shell{width:min(1180px,calc(100% - 48px));margin:auto}.band{padding:clamp(64px,9vw,112px) 0}.dark{background:var(--black);color:#fff}.kicker{margin:0 0 22px;color:var(--red);font:700 14px/1.2 ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase}.hero{padding:clamp(76px,11vw,140px) 0 72px}.hero h1{max-width:900px;margin:0;font-family:Arial,system-ui,sans-serif;font-size:clamp(56px,10vw,118px);line-height:.94;font-weight:800;letter-spacing:-.02em}.hero p{max-width:700px;margin:36px 0 0;color:#c8cbd0;font-size:clamp(20px,2vw,27px)}
nav{position:sticky;top:0;z-index:2;overflow:auto;background:#fff;border-bottom:1px solid var(--line);white-space:nowrap}nav .shell{display:flex;gap:28px}nav a{padding:18px 0;color:var(--muted);font-weight:700;text-decoration:none}nav a:hover,nav a:focus-visible{color:var(--red)}
h2{max-width:820px;margin:0;font-family:Arial,system-ui,sans-serif;font-size:clamp(38px,6vw,70px);line-height:1;font-weight:800}p.lead{max-width:760px;margin:30px 0 0;color:var(--muted);font-size:22px}.weights{margin-top:64px;border-top:1px solid var(--line)}.weights article{display:grid;grid-template-columns:90px 1fr;gap:24px;padding:30px 0;border-bottom:1px solid var(--line)}.weights span{color:var(--red);font:700 15px ui-monospace,monospace}.weights strong,.weights em{display:block;font-family:Arial,system-ui,sans-serif;font-size:clamp(27px,4vw,48px);line-height:1.08}.weights em{margin-top:12px;color:var(--muted);font-size:clamp(21px,3vw,34px)}
.proof{margin-top:56px;font-family:Arial,system-ui,sans-serif;font-size:clamp(30px,6vw,68px);line-height:1.2;overflow-wrap:normal}.figures{font-variant-numeric:tabular-nums lining-nums}.technical{display:grid;grid-template-columns:1fr 1fr;gap:60px;margin-top:56px}.technical p{margin:0;color:#d1d3d7;font-size:24px}.technical code{display:block;margin-top:18px;color:#fff;font:500 18px/1.8 ui-monospace,monospace}.ui{display:grid;grid-template-columns:1.1fr .9fr;gap:60px;margin-top:60px;align-items:start}.ui h3{margin:0;font-family:Arial,system-ui,sans-serif;font-size:42px;line-height:1}.ui p{color:var(--muted)}.button{display:inline-flex;min-height:52px;align-items:center;margin-top:18px;padding:12px 20px;background:var(--red);color:#fff;font-weight:700}.status{padding:26px 0;border-top:1px solid var(--line)}.status:last-child{border-bottom:1px solid var(--line)}.status b{display:block;font-size:24px}.status span{color:var(--muted)}
footer{padding:48px 0;background:#0a0a0b;color:#a9adb2}footer strong{color:#fff}
@media(max-width:700px){.shell{width:calc(100% - 36px)}.technical,.ui{grid-template-columns:1fr}.weights article{grid-template-columns:54px 1fr}.hero h1{font-size:54px}.proof{font-size:34px}.band{padding:64px 0}}
</style>
</head>
<body>
<header class="hero dark"><div class="shell"><p class="kicker">UMSA / Control visual / 2.1</p><h1>CANDIDATE 2.1<br>QA LOCAL</h1><p>El corte romano se prueba en palabra, párrafo y escala. La familia sigue bloqueada para producción hasta cerrar itálicas, plataformas y revisión independiente.</p></div></header>
<nav aria-label="Specimen"><div class="shell"><a href="#familia">Familia</a><a href="#repertorio">Repertorio</a><a href="#tecnico">Técnico</a><a href="#interfaz">Interfaz</a><a href="#estado">Estado</a></div></nav>
<main>
<section id="familia" class="band"><div class="shell"><p class="kicker">01 / Familia</p><h2>Siete pesos.<br>Romana y cursiva.</h2><div class="weights">__ROWS__</div></div></section>
<section id="repertorio" class="band dark"><div class="shell"><p class="kicker">02 / Repertorio</p><h2>Español completo.<br>Información técnica.</h2><div class="proof">ABCDEFGHIJKLMNÑOPQRSTUVWXYZ<br>abcdefghijklmnñopqrstuvwxyz<br>ÁÉÍÓÚÜÑ áéíóúüñ ¿? ¡! “ ” « »</div><div class="proof figures">0123456789 · 24/7 · 99,98%<br>$ 1.234.567,89 · € £ ¥</div></div></section>
<section id="tecnico" class="band dark"><div class="shell"><p class="kicker">03 / Lenguaje técnico</p><h2>Datos que se leen<br>sin ambigüedad.</h2><div class="technical"><p>Red de fibra certificada con continuidad 24/7 y SLA documentado.<code>INC-2847 · 10.20.16.24<br>UPTIME 99,98%<br>OTDR 1.550 nm · -18,4 dBm</code></p><p class="figures">CUIT 30-71234567-8<br>ARS 1.234.567,89<br>14/07/2026 · 03:42<br>Rack A-17 · VLAN 240</p></div></div></section>
<section id="interfaz" class="band"><div class="shell"><p class="kicker">04 / Interfaz</p><h2>Jerarquía sin ruido.</h2><div class="ui"><div><h3>Solicitar relevamiento</h3><p>Describa el sitio, la restricción operativa y el plazo. ULTIMA MILLA responde con alcance y próximo paso.</p><span class="button">Hablar con un especialista</span></div><div><div class="status"><b>Operativo</b><span>Monitoreo y soporte activos</span></div><div class="status"><b>En revisión</b><span>Evidencia y documentación</span></div><div class="status"><b>Crítico</b><span>Escalado inmediato</span></div></div></div></div></section>
<section id="estado" class="band"><div class="shell"><p class="kicker">05 / Estado de entrega</p><h2>Roman mejorado.<br>Distribución bloqueada.</h2><p class="lead">La cobertura y la compilación ya son completas para el candidato local. El próximo paso es cerrar la topología itálica, repetir pruebas de palabra y obtener QA físico e independiente antes de generar una nueva release.</p></div></section>
</main>
<footer><div class="shell"><strong>UM Sans 2.0 — Build rechazada</strong><br>Copyright 2026 ULTIMA MILLA S.A. Evaluación interna. No distribuir.</div></footer>
</body></html>
""".replace("__ROWS__", "\n".join(rows))
    if os.environ.get("UM_SANS_2_CANDIDATE_QA") == "1":
        qa_faces = """
@font-face{font-family:'UM Sans 2 QA';src:url('./UMSans2-Regular.woff2') format('woff2');font-weight:400;font-style:normal;font-display:block}
@font-face{font-family:'UM Sans 2 QA';src:url('./UMSans2-SemiBold.woff2') format('woff2');font-weight:600;font-style:normal;font-display:block}
@font-face{font-family:'UM Sans 2 QA';src:url('./UMSans2-Bold.woff2') format('woff2');font-weight:700;font-style:normal;font-display:block}
@font-face{font-family:'UM Sans 2 QA';src:url('./UMSans2-Black.woff2') format('woff2');font-weight:900;font-style:normal;font-display:block}
@font-face{font-family:'UM Sans 2 QA';src:url('./UMSans2-Italic.woff2') format('woff2');font-weight:400;font-style:italic;font-display:block}
"""
        html = html.replace(":root{", qa_faces + "\n:root{")
        html = html.replace(
            "font-family:Arial,system-ui,sans-serif",
            "font-family:'UM Sans 2 QA',Arial,system-ui,sans-serif",
        )
        html = html.replace("UM Sans 2 — Build rechazada", "UM Sans 2 — Candidate visual QA")
        html = html.replace("BUILD 2.0<br>RECHAZADA", "CANDIDATE 2.0<br>VISUAL QA")
    (OUTPUT / "specimen.html").write_text(html, encoding="utf-8")


def package_release() -> Path:
    archive = OUTPUT / "UMSans2-2.0-Original-Beta.zip"
    files = [path for path in OUTPUT.rglob("*") if path.is_file() and path != archive]
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as bundle:
        for path in sorted(files):
            info = zipfile.ZipInfo(str(path.relative_to(OUTPUT)), ZIP_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            bundle.writestr(info, path.read_bytes())
    return archive


def build() -> None:
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir(parents=True)
    SOURCE_OUTPUT.mkdir()
    MASTER_OUTPUT.mkdir()
    report: dict[str, object] = {
        "masters": [],
        "statics": [],
        "variables": [],
        "variableStatus": "blocked: cleaned masters are not contour-compatible",
        "visualStatus": "blocked: roman core improved; italic topology, multiscale review and independent sign-off remain pending",
    }

    for italic in (False, True):
        masters: list[tuple[Design, Path]] = []
        for weight, optical in MASTER_LOCATIONS:
            d = Design(weight, optical, italic)
            slug = f"UMSans2-{weight}-{optical}{'-Italic' if italic else ''}"
            ttf_path = MASTER_OUTPUT / f"{slug}.ttf"
            report["masters"].append(make_font(d, ttf_path))
            ufo_path = SOURCE_OUTPUT / f"{slug}.ufo"
            save_ufo(d, ufo_path)
            masters.append((d, ttf_path))
        designspace_path = SOURCE_OUTPUT / f"UMSans2-{'Italic' if italic else 'Roman'}.designspace"
        build_designspace(italic, masters, designspace_path)
        feature_design = Design(400, 14, italic)
        order, _, metrics, _ = build_glyph_set(feature_design)
        (SOURCE_OUTPUT / f"features-{'italic' if italic else 'roman'}.fea").write_text(feature_source(order, metrics, feature_design))

    for weight, style in WEIGHTS:
        optical = 14 if weight <= 500 else 24 if weight <= 700 else 48
        for italic in (False, True):
            d = Design(weight, optical, italic)
            file_style = "Italic" if weight == 400 and italic else f"{style}{'Italic' if italic else ''}"
            ttf_path = OUTPUT / f"UMSans2-{file_style}.ttf"
            report["statics"].append(make_font(
                d,
                ttf_path,
                style_name=weight_name(weight, italic),
                cleanup_overlaps=True,
            ))
            # CFF/OTF keeps the clean source outlines; TrueType hinting adds a
            # private marker glyph that belongs only in TTF and derived WOFF2.
            write_otf(ttf_path, OUTPUT / f"UMSans2-{file_style}.otf", d)
            autohint_ttf(ttf_path)
            write_woff2(ttf_path, OUTPUT / f"UMSans2-{file_style}.woff2")

    artifacts = [path for path in OUTPUT.rglob("*") if path.is_file() and path.name != "CHECKSUMS.sha256"]
    inventory = [
        {
            "path": str(path.relative_to(OUTPUT)),
            "bytes": path.stat().st_size,
            "sha256": sha256(path),
        }
        for path in sorted(artifacts)
    ]
    report["inventory"] = inventory
    (OUTPUT / "build-report.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n")
    write_docs(report)
    write_standalone_specimen()
    artifacts = [path for path in OUTPUT.rglob("*") if path.is_file() and path.name != "CHECKSUMS.sha256"]
    checksums = "\n".join(f"{sha256(path)}  {path.relative_to(OUTPUT)}" for path in sorted(artifacts)) + "\n"
    (OUTPUT / "CHECKSUMS.sha256").write_text(checksums)
    print(json.dumps({
        "family": FAMILY,
        "version": VERSION_LABEL,
        "masters": len(report["masters"]),
        "statics": len(report["statics"]),
        "variables": len(report["variables"]),
        "archive": None,
        "distribution": "blocked: candidate review incomplete",
        "output": str(OUTPUT),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    build()
