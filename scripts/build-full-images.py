import json, fitz, os
manifest = json.load(open("C:/Users/bablu/Desktop/CityBizz/docs/screens/manifest.json"))
doc = fitz.open()

# cover
cover = doc.new_page(width=595, height=842)
cover.insert_text((40, 60), "BETTER URBAN", fontsize=11, fontname="hebo", color=(0.4,0.4,0.4))
cover.insert_text((40, 95), "Screen deck (full images)", fontsize=30, fontname="hebo")
cover.insert_text((40, 120), "Every screen of the prototype, full screenshot, no cropping.", fontsize=12)
cover.insert_text((40, 140), "Tutedude Buildathon 2026 - CityFix track", fontsize=10, color=(0.4,0.4,0.4))
cover.insert_text((40, 155), "Prototype: synthetic demo data, simulated dispatch, not affiliated with any government body.", fontsize=9, color=(0.4,0.4,0.4))
y = 185
for i, e in enumerate(manifest):
    cover.insert_text((40, y), f"{i+1:02d}   {e['title']}   {e['route']}", fontsize=9)
    y += 13
cover.insert_image(fitz.Rect(330, 100, 560, 560), filename=manifest[0]["src"])

for idx, e in enumerate(manifest):
    src = e["src"]
    pix = fitz.Pixmap(src)
    w, h = pix.width, pix.height
    landscape = w >= h
    if landscape:
        page = doc.new_page(width=842, height=595)
    else:
        page = doc.new_page(width=595, height=842)
    pw, ph = page.rect.width, page.rect.height
    page.insert_text((40, 40), e["title"], fontsize=16, fontname="hebo")
    page.insert_text((40, 62), f"{e['route']}   -   {e['note']}", fontsize=9, color=(0.4,0.4,0.4))
    page.insert_text((pw-130, 30), f"page {idx+2} of {len(manifest)+1}", fontsize=9, color=(0.4,0.4,0.4))
    margin = 40
    top = 80
    avail_w = pw - 2*margin
    avail_h = ph - top - margin
    scale = min(avail_w/w, avail_h/h)
    dw, dh = w*scale, h*scale
    x0 = margin + (avail_w - dw)/2
    y0 = top + (avail_h - dh)/2
    rect = fitz.Rect(x0, y0, x0+dw, y0+dh)
    page.insert_image(rect, filename=src)
    page.draw_rect(rect, color=(0.85,0.85,0.85), width=0.5)
    page.insert_text((40, ph-15), "Prototype - synthetic demo data - simulated dispatch - not affiliated with any government body.", fontsize=8, color=(0.5,0.5,0.5))

out = "C:/Users/bablu/Desktop/CityBizz/docs/Better-Urban-full-images.pdf"
doc.save(out, garbage=4, deflate=True)
doc.close()
print("saved", out)
PY