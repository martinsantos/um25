#!/usr/bin/env python3
"""Create the hand-authored UM Sans 2 UFO control master.

This is a one-time bootstrap. Each glyph below has its own explicit outline;
there is no imported font, tracing, skeleton expansion or alphabet generator.
After creation, the UFO is the editable source of truth and this script must
not overwrite it unless the designer explicitly passes --force.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from defcon import Font


ROOT = Path(__file__).resolve().parents[2]
UFO_PATH = ROOT / "type" / "um-sans-2" / "sources" / "UMSans2Display-Bold.ufo"
KAPPA = 0.5522847498


def rect(pen, x0, y0, x1, y1, reverse=False):
    points = [(x0, y0), (x0, y1), (x1, y1), (x1, y0)]
    if reverse:
        points.reverse()
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def polygon(pen, points, reverse=False):
    if reverse:
        points = list(reversed(points))
    pen.moveTo(points[0])
    for point in points[1:]:
        pen.lineTo(point)
    pen.closePath()


def oval(pen, x0, y0, x1, y1, reverse=False):
    cx = (x0 + x1) / 2
    cy = (y0 + y1) / 2
    rx = (x1 - x0) / 2
    ry = (y1 - y0) / 2
    if reverse:
        pen.moveTo((cx, y1))
        pen.curveTo((cx - KAPPA * rx, y1), (x0, cy + KAPPA * ry), (x0, cy))
        pen.curveTo((x0, cy - KAPPA * ry), (cx - KAPPA * rx, y0), (cx, y0))
        pen.curveTo((cx + KAPPA * rx, y0), (x1, cy - KAPPA * ry), (x1, cy))
        pen.curveTo((x1, cy + KAPPA * ry), (cx + KAPPA * rx, y1), (cx, y1))
    else:
        pen.moveTo((cx, y1))
        pen.curveTo((cx + KAPPA * rx, y1), (x1, cy + KAPPA * ry), (x1, cy))
        pen.curveTo((x1, cy - KAPPA * ry), (cx + KAPPA * rx, y0), (cx, y0))
        pen.curveTo((cx - KAPPA * rx, y0), (x0, cy - KAPPA * ry), (x0, cy))
        pen.curveTo((x0, cy + KAPPA * ry), (cx - KAPPA * rx, y1), (cx, y1))
    pen.closePath()


def ring(pen, outer, inner):
    oval(pen, *outer)
    oval(pen, *inner, reverse=True)


def add_glyph(font, name, width, unicode_value, draw=None):
    glyph = font.newGlyph(name)
    glyph.width = width
    if unicode_value is not None:
        glyph.unicodes = [unicode_value]
    if draw is not None:
        draw(glyph.getPen())
    return glyph


def draw_notdef(pen):
    rect(pen, 50, -20, 610, 740)
    rect(pen, 170, 100, 490, 620, reverse=True)
    polygon(pen, [(188, 124), (264, 124), (472, 596), (396, 596)])
    polygon(pen, [(396, 124), (472, 124), (264, 596), (188, 596)])


def draw_H(pen):
    polygon(pen, [
        (54, 0), (202, 0), (202, 290), (498, 290), (498, 0), (646, 0),
        (646, 720), (498, 720), (498, 430), (202, 430), (202, 720), (54, 720),
    ])


def draw_F(pen):
    polygon(pen, [
        (54, 0), (202, 0), (202, 296), (548, 296), (548, 434),
        (202, 434), (202, 580), (646, 580), (646, 720), (54, 720),
    ])


def draw_O(pen):
    # Optical oval: the sides carry slightly more tension than the shoulders.
    pen.moveTo((370, 734))
    pen.curveTo((574, 734), (698, 594), (698, 360))
    pen.curveTo((698, 126), (574, -14), (370, -14))
    pen.curveTo((166, -14), (42, 126), (42, 360))
    pen.curveTo((42, 594), (166, 734), (370, 734))
    pen.closePath()
    pen.moveTo((370, 600))
    pen.curveTo((254, 600), (184, 512), (184, 360))
    pen.curveTo((184, 208), (254, 120), (370, 120))
    pen.curveTo((486, 120), (556, 208), (556, 360))
    pen.curveTo((556, 512), (486, 600), (370, 600))
    pen.closePath()


def draw_o(pen):
    pen.moveTo((312, 554))
    pen.curveTo((480, 554), (584, 446), (584, 270))
    pen.curveTo((584, 94), (480, -14), (312, -14))
    pen.curveTo((144, -14), (40, 94), (40, 270))
    pen.curveTo((40, 446), (144, 554), (312, 554))
    pen.closePath()
    pen.moveTo((312, 416))
    pen.curveTo((232, 416), (188, 360), (188, 270))
    pen.curveTo((188, 180), (232, 124), (312, 124))
    pen.curveTo((392, 124), (436, 180), (436, 270))
    pen.curveTo((436, 360), (392, 416), (312, 416))
    pen.closePath()


def draw_a(pen):
    # The right stem is part of the silhouette, not a rectangle unioned to a bowl.
    pen.moveTo((558, 0))
    pen.lineTo((558, 540))
    pen.lineTo((410, 540))
    pen.lineTo((410, 486))
    pen.curveTo((374, 530), (324, 554), (270, 554))
    pen.curveTo((126, 554), (34, 438), (34, 270))
    pen.curveTo((34, 102), (126, -14), (270, -14))
    pen.curveTo((324, -14), (374, 10), (410, 54))
    pen.lineTo((410, 0))
    pen.closePath()
    pen.moveTo((276, 414))
    pen.curveTo((350, 414), (406, 356), (406, 270))
    pen.curveTo((406, 184), (350, 126), (276, 126))
    pen.curveTo((204, 126), (182, 184), (182, 270))
    pen.curveTo((182, 356), (204, 414), (276, 414))
    pen.closePath()


def draw_b(pen):
    pen.moveTo((54, 0))
    pen.lineTo((54, 760))
    pen.lineTo((202, 760))
    pen.lineTo((202, 478))
    pen.curveTo((244, 526), (298, 554), (356, 554))
    pen.curveTo((498, 554), (594, 440), (594, 270))
    pen.curveTo((594, 100), (498, -14), (356, -14))
    pen.curveTo((298, -14), (244, 14), (202, 62))
    pen.lineTo((202, 0))
    pen.closePath()
    pen.moveTo((350, 416))
    pen.curveTo((278, 416), (242, 358), (242, 270))
    pen.curveTo((242, 182), (278, 124), (350, 124))
    pen.curveTo((414, 124), (446, 182), (446, 270))
    pen.curveTo((446, 358), (414, 416), (350, 416))
    pen.closePath()


def draw_d(pen):
    pen.moveTo((562, 0))
    pen.lineTo((562, 760))
    pen.lineTo((414, 760))
    pen.lineTo((414, 478))
    pen.curveTo((372, 526), (318, 554), (254, 554))
    pen.curveTo((114, 554), (34, 440), (34, 270))
    pen.curveTo((34, 100), (114, -14), (254, -14))
    pen.curveTo((318, -14), (372, 14), (414, 62))
    pen.lineTo((414, 0))
    pen.closePath()
    pen.moveTo((258, 416))
    pen.curveTo((330, 416), (374, 358), (374, 270))
    pen.curveTo((374, 182), (330, 124), (258, 124))
    pen.curveTo((190, 124), (182, 182), (182, 270))
    pen.curveTo((182, 358), (190, 416), (258, 416))
    pen.closePath()


def draw_p(pen):
    pen.moveTo((54, -220))
    pen.lineTo((54, 540))
    pen.lineTo((202, 540))
    pen.lineTo((202, 478))
    pen.curveTo((244, 526), (298, 554), (356, 554))
    pen.curveTo((498, 554), (594, 440), (594, 270))
    pen.curveTo((594, 100), (498, -14), (356, -14))
    pen.curveTo((298, -14), (244, 14), (202, 62))
    pen.lineTo((202, -220))
    pen.closePath()
    pen.moveTo((350, 416))
    pen.curveTo((278, 416), (242, 358), (242, 270))
    pen.curveTo((242, 182), (278, 124), (350, 124))
    pen.curveTo((414, 124), (446, 182), (446, 270))
    pen.curveTo((446, 358), (414, 416), (350, 416))
    pen.closePath()


def draw_c(pen):
    pen.moveTo((548, 390))
    pen.curveTo((502, 500), (418, 554), (300, 554))
    pen.curveTo((140, 554), (38, 446), (38, 270))
    pen.curveTo((38, 94), (140, -14), (300, -14))
    pen.curveTo((418, -14), (502, 40), (548, 150))
    pen.lineTo((422, 210))
    pen.curveTo((394, 152), (354, 122), (300, 122))
    pen.curveTo((226, 122), (182, 178), (182, 270))
    pen.curveTo((182, 362), (226, 418), (300, 418))
    pen.curveTo((354, 418), (394, 388), (422, 330))
    pen.closePath()


def draw_e(pen):
    # Alpha 6 enlarges the aperture from 54 to 116 units and reduces the
    # crossbar from 110 to 74 units. Alpha 5 passed structural checks but its
    # aperture collapsed optically into a capsule at mobile raster sizes.
    pen.moveTo((590, 298))
    pen.lineTo((184, 298))
    pen.curveTo((194, 374), (242, 420), (312, 420))
    pen.curveTo((372, 420), (418, 392), (450, 342))
    pen.lineTo((564, 414))
    pen.curveTo((508, 510), (420, 554), (310, 554))
    pen.curveTo((140, 554), (38, 444), (38, 270))
    pen.curveTo((38, 96), (140, -14), (310, -14))
    pen.curveTo((428, -14), (518, 36), (566, 132))
    pen.lineTo((444, 210))
    pen.curveTo((416, 150), (374, 120), (312, 120))
    pen.curveTo((244, 120), (196, 160), (184, 224))
    pen.lineTo((590, 224))
    pen.closePath()


def draw_s(pen):
    pen.moveTo((526, 426))
    pen.curveTo((482, 512), (402, 554), (288, 554))
    pen.curveTo((142, 554), (50, 484), (50, 378))
    pen.curveTo((50, 274), (120, 226), (252, 192))
    pen.lineTo((346, 168))
    pen.curveTo((402, 154), (424, 134), (424, 104))
    pen.curveTo((424, 68), (384, 44), (320, 44))
    pen.curveTo((230, 44), (178, 78), (142, 132))
    pen.lineTo((26, 92))
    pen.curveTo((74, 20), (170, -14), (304, -14))
    pen.curveTo((466, -14), (558, 60), (558, 180))
    pen.curveTo((558, 292), (482, 342), (340, 380))
    pen.lineTo((248, 404))
    pen.curveTo((202, 416), (184, 432), (184, 456))
    pen.curveTo((184, 484), (220, 502), (282, 502))
    pen.curveTo((352, 502), (394, 474), (416, 430))
    pen.closePath()


def draw_n(pen):
    pen.moveTo((54, 0))
    pen.lineTo((54, 540))
    pen.lineTo((202, 540))
    pen.lineTo((202, 452))
    pen.curveTo((248, 518), (312, 554), (386, 554))
    pen.curveTo((508, 554), (578, 468), (578, 334))
    pen.lineTo((578, 0))
    pen.lineTo((430, 0))
    pen.lineTo((430, 316))
    pen.curveTo((430, 394), (400, 430), (346, 430))
    pen.curveTo((292, 430), (202, 384), (202, 294))
    pen.lineTo((202, 0))
    pen.closePath()


def draw_u(pen):
    pen.moveTo((54, 540))
    pen.lineTo((202, 540))
    pen.lineTo((202, 224))
    pen.curveTo((202, 146), (232, 110), (286, 110))
    pen.curveTo((340, 110), (430, 156), (430, 246))
    pen.lineTo((430, 540))
    pen.lineTo((578, 540))
    pen.lineTo((578, 0))
    pen.lineTo((430, 0))
    pen.lineTo((430, 88))
    pen.curveTo((384, 22), (320, -14), (246, -14))
    pen.curveTo((124, -14), (54, 72), (54, 206))
    pen.closePath()


def draw_r(pen):
    pen.moveTo((54, 0))
    pen.lineTo((54, 540))
    pen.lineTo((202, 540))
    pen.lineTo((202, 450))
    pen.curveTo((242, 514), (290, 554), (350, 554))
    pen.curveTo((390, 554), (422, 544), (444, 526))
    pen.lineTo((398, 390))
    pen.curveTo((374, 410), (350, 420), (324, 420))
    pen.curveTo((252, 420), (202, 350), (202, 246))
    pen.lineTo((202, 0))
    pen.closePath()


def draw_i(pen):
    rect(pen, 52, 0, 200, 396)
    oval(pen, 52, 454, 200, 602)


def draw_l(pen):
    rect(pen, 52, 0, 200, 760)


def draw_t(pen):
    polygon(pen, [
        (166, 0), (314, 0), (314, 388), (454, 388), (454, 524),
        (314, 524), (314, 700), (166, 700), (166, 524), (44, 524),
        (44, 388), (166, 388),
    ])


def draw_f(pen):
    # Alpha 4 kept a 140-unit left sidebearing from an early skeleton. It
    # created a visible word break in "eficiente" even with zero tracking.
    # Alpha 5 moves the stem to the optical margin and shortens the arm.
    pen.moveTo((60, 0))
    pen.lineTo((208, 0))
    pen.lineTo((208, 358))
    pen.lineTo((394, 358))
    pen.lineTo((394, 494))
    pen.lineTo((208, 494))
    pen.lineTo((208, 540))
    pen.curveTo((208, 616), (242, 636), (296, 636))
    pen.curveTo((330, 636), (356, 628), (382, 614))
    pen.lineTo((422, 732))
    pen.curveTo((390, 750), (348, 760), (298, 760))
    pen.curveTo((150, 760), (60, 680), (60, 540))
    pen.lineTo((60, 494))
    pen.lineTo((20, 494))
    pen.lineTo((20, 358))
    pen.lineTo((60, 358))
    pen.closePath()


def draw_period(pen):
    oval(pen, 56, -8, 194, 130)


def draw_comma(pen):
    oval(pen, 56, -8, 194, 130)
    polygon(pen, [(126, 38), (194, 38), (132, -138), (54, -138)])


def draw_acute(pen):
    polygon(pen, [(212, 620), (332, 620), (442, 770), (286, 770)])


def build(force=False):
    if UFO_PATH.exists() and any((UFO_PATH / "glyphs").glob("*.glif")) and not force:
        raise SystemExit(f"Refusing to overwrite editable UFO: {UFO_PATH}. Use --force explicitly.")

    UFO_PATH.mkdir(parents=True, exist_ok=True)
    font = Font()
    info = font.info
    info.familyName = "UM Sans 2 Manual"
    info.styleName = "Display Bold Alpha 6"
    info.unitsPerEm = 1000
    info.ascender = 780
    info.descender = -220
    info.capHeight = 720
    info.xHeight = 540
    info.openTypeOS2WeightClass = 700
    info.openTypeOS2WidthClass = 5
    info.versionMajor = 0
    info.versionMinor = 700
    info.copyright = "Copyright 2026 ULTIMA MILLA S.A. Hand-authored alpha outlines."
    info.note = "Independent manual Alpha 6 control redraw. Not approved for production or distribution."

    add_glyph(font, ".notdef", 660, None, draw_notdef)
    add_glyph(font, "space", 290, 0x20)
    add_glyph(font, "H", 700, ord("H"), draw_H)
    add_glyph(font, "F", 690, ord("F"), draw_F)
    add_glyph(font, "O", 740, ord("O"), draw_O)
    add_glyph(font, "o", 624, ord("o"), draw_o)
    add_glyph(font, "a", 606, ord("a"), draw_a)
    add_glyph(font, "b", 636, ord("b"), draw_b)
    add_glyph(font, "c", 584, ord("c"), draw_c)
    add_glyph(font, "d", 610, ord("d"), draw_d)
    add_glyph(font, "e", 616, ord("e"), draw_e)
    add_glyph(font, "f", 472, ord("f"), draw_f)
    add_glyph(font, "i", 252, ord("i"), draw_i)
    add_glyph(font, "l", 252, ord("l"), draw_l)
    add_glyph(font, "n", 632, ord("n"), draw_n)
    add_glyph(font, "p", 636, ord("p"), draw_p)
    add_glyph(font, "r", 492, ord("r"), draw_r)
    add_glyph(font, "s", 584, ord("s"), draw_s)
    add_glyph(font, "t", 498, ord("t"), draw_t)
    add_glyph(font, "u", 632, ord("u"), draw_u)
    add_glyph(font, "period", 250, ord("."), draw_period)
    add_glyph(font, "comma", 250, ord(","), draw_comma)
    add_glyph(font, "acutecomb", 0, 0x301, draw_acute)

    oacute = add_glyph(font, "oacute", 624, 0x00F3)
    base = oacute.instantiateComponent()
    base.baseGlyph = "o"
    oacute.appendComponent(base)
    mark = oacute.instantiateComponent()
    mark.baseGlyph = "acutecomb"
    oacute.appendComponent(mark)

    font.lib["public.glyphOrder"] = list(font.keys())
    # Alpha 5 validates sidebearings before introducing pair adjustments.
    # Premature negative kerning hid bad advances and produced collisions.
    font.features.text = """languagesystem DFLT dflt;\nlanguagesystem latn dflt;\n"""
    font.save(UFO_PATH, formatVersion=3)
    print(f"Created manual UFO control master: {UFO_PATH}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    args = parser.parse_args()
    build(force=args.force)
