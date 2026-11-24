import json, fitz, os
manifest = json.load(open("C:/Users/bablu/Desktop/CityBizz/docs/screens/manifest.json"))
tmp = "C:/Users/bablu/AppData/Local/Temp/opencode/crops"
os.makedirs(tmp, exist_ok=True)
doc = fitz.open()

def crop_src(e):
    src = e["src"]
    crop = e.get("crop")
    if not crop:
        return src
    pix = fitz.Pixmap(src)
    r = fitz.IRect(crop["x"], crop["y"], crop["x"]+crop["w"], crop["y"]+crop["h"])
    target = fitz.Pixmap(fitz.csRGB, fitz.IRect(0,0,r.width,r.height), False)
    target.copy(pix, r)
    out = os.path.join(tmp, e["name"] + ".png")
    target.save(out)
    return out

# cover
page = doc.new_page(width=595, height=842)
page.insert_text((40, 60), "BETTER URBAN", fontsize=11, fontname="hebo", color=(0.4,0.4,0.4))
page.insert_text((40, 95), "Screen deck", fontsize=30, fontname="hebo")
page.insert_text((40, 120), "Every screen of the prototype, captured at phone-frame resolution.", fontsize=12)
page.insert_text((40, 140), "Tutedude Buildathon 2026 - CityFix track - 23 to 28 Nov 2026", fontsize=10, color=(0.4,0.4,0.4))
page.insert_text((40, 155), "Prototype: synthetic demo data, simulated dispatch, not affiliated with any government body.", fontsize=9, color=(0.4,0.4,0.4))
page.insert_text((40, 185), "Screens", fontsize=10, fontname="hebo")
y = 200
for i, e in enumerate(manifest):
    page.insert_text((40, y), f"{i+1:02d}   {e['title']}   {e['route']}", fontsize=9)
    y += 13
src0 = crop_src(manifest[0])
page.insert_image(fitz.Rect(330, 100, 560, 560), filename=src0)
page.draw_rect(fitz.Rect(330,100,560,560), color=(0.89,0.88,0.83), width=1)

for idx, e in enumerate(manifest):
    landscape = e.get("landscape", False)
    if landscape:
        page = doc.new_page(width=842, height=595)
        box = fitz.Rect(40, 92, 802, 555)
    else:
        page = doc.new_page(width=595, height=842)
        box = fitz.Rect(97, 92, 498, 802)
    page.insert_text((40, 30), "Better Urban - screen deck", fontsize=9, color=(0.4,0.4,0.4))
    pn_x = (box.x1 - 70) if not landscape else 772
    page.insert_text((pn_x, 30), f"page {idx+2} of {len(manifest)+1}", fontsize=9, color=(0.4,0.4,0.4))
    page.insert_text((40, 52), e["title"], fontsize=16, fontname="hebo")
    page.insert_text((40, 72), f"{e['route']}   -   {e['note']}", fontsize=9, color=(0.4,0.4,0.4))
    src = crop_src(e)
    page.insert_image(box, filename=src)
    page.draw_rect(box, color=(0.89,0.88,0.83), width=1)
    page.insert_text((40, page.rect.height-20), "Prototype - synthetic demo data - simulated dispatch - not affiliated with any government body.", fontsize=8, color=(0.4,0.4,0.4))

out = "C:/Users/bablu/Desktop/CityBizz/docs/Better-Urban-screen-deck.pdf"
doc.save(out, garbage=4, deflate=True)
doc.close()
print("saved", out)
PY