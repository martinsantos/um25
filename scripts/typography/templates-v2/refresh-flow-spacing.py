"""Update document flow without rebuilding fonts, artwork or Excel formulas."""
from pathlib import Path
import argparse, shutil, zipfile
from lxml import etree

W = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
Q = lambda name: "{" + W + "}" + name
NS = {"w": W}

def paragraph_spacing(paragraph):
    pr = paragraph.find(Q("pPr"))
    if pr is None:
        pr = etree.Element(Q("pPr")); paragraph.insert(0, pr)
    spacing = pr.find(Q("spacing"))
    if spacing is None:
        spacing = etree.SubElement(pr, Q("spacing"))
    return pr, spacing

def refresh_word(path):
    with zipfile.ZipFile(path) as archive:
        files = {name: archive.read(name) for name in archive.namelist()}
    xml = etree.fromstring(files["word/document.xml"])
    body = xml.find(Q("body"))
    for table in body.findall(Q("tbl")):
        rows = table.findall(Q("tr"))
        if len(rows) <= 8:
            for index, row in enumerate(rows):
                for cell_paragraph in row.xpath("./w:tc/w:p", namespaces=NS):
                    cell_pr, _ = paragraph_spacing(cell_paragraph)
                    keep = cell_pr.find(Q("keepNext"))
                    if keep is None: keep = etree.SubElement(cell_pr, Q("keepNext"))
                    keep.set(Q("val"), "1" if index < len(rows) - 1 else "0")
            preceding = table.getprevious()
            if preceding is not None and preceding.tag == Q("p"):
                preceding_pr, _ = paragraph_spacing(preceding)
                style = preceding_pr.find(Q("pStyle"))
                if style is not None and style.get(Q("val")) == "Caption":
                    keep = preceding_pr.find(Q("keepNext"))
                    if keep is None: keep = etree.SubElement(preceding_pr, Q("keepNext"))
                    keep.set(Q("val"), "1")
        paragraph = table.getnext()
        if paragraph is None or paragraph.tag != Q("p"):
            continue
        pr, spacing = paragraph_spacing(paragraph)
        empty = not "".join(paragraph.itertext()).strip() and not paragraph.xpath(".//w:drawing", namespaces=NS)
        if empty:
            following = paragraph.getnext()
            if following is not None and following.tag == Q("p") and following.find("w:pPr/w:pageBreakBefore", NS) is not None:
                # Small tables stay whole, and a new section can share their overflow page.
                if len(rows) <= 8:
                    following.find("w:pPr/w:pageBreakBefore", NS).set(Q("val"), "0")
                    heading_pr, heading_spacing = paragraph_spacing(following)
                    style = heading_pr.find(Q("pStyle"))
                    level = style.get(Q("val"), "Heading1") if style is not None else "Heading1"
                    heading_spacing.set(Q("before"), str(320 + {"Heading1":480,"Heading2":360,"Heading3":320}.get(level,480)))
                body.replace(paragraph, following)
                continue
            spacing.set(Q("before"), "0"); spacing.set(Q("after"), "0")
            spacing.set(Q("line"), "320"); spacing.set(Q("lineRule"), "exact")
            if pr.find(Q("keepNext")) is None:
                etree.SubElement(pr, Q("keepNext"))
            for size in paragraph.xpath(".//w:sz", namespaces=NS):
                size.set(Q("val"), "2")
        else:
            style = pr.find(Q("pStyle"))
            if style is None or not style.get(Q("val"), "").startswith("Heading"):
                spacing.set(Q("before"), str(max(320, int(spacing.get(Q("before"), "0")))))
    files["word/document.xml"] = etree.tostring(xml, xml_declaration=True, encoding="UTF-8", standalone=True)
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as archive:
        for name, content in files.items(): archive.writestr(name, content)

def refresh_html(path):
    text = path.read_text().replace("margin:18px 0 24px;font-size:18px", "margin:18px 0 32px;font-size:18px")
    text = text.replace("margin:10pt 0 12pt", "margin:10pt 0 16pt")
    flow = "main>:is(.table-wrap,.table-scroll){margin:18px 0 32px}main>:is(.table-wrap,.table-scroll)>table{margin:0}main>:is(ul,ol){margin:16px 0 32px}main>:is(ul,ol)>li+li{margin-top:6px}@media print{main>:is(.table-wrap,.table-scroll){margin:10pt 0 16pt}main>:is(ul,ol){margin:8pt 0 16pt}main>:is(ul,ol)>li+li{margin-top:3pt}}"
    text = text.replace("</style>", flow + "</style>", 1)
    path.write_text(text)

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path); parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    if args.destination.exists(): raise SystemExit("Use a fresh destination; existing releases are immutable.")
    shutil.copytree(args.source, args.destination, ignore=shutil.ignore_patterns("*.zip"))
    for path in args.destination.glob("*.docx"): refresh_word(path)
    for path in args.destination.glob("*.dotx"): refresh_word(path)
    for path in args.destination.glob("*.html"): refresh_html(path)
    print(args.destination)

if __name__ == "__main__": main()
