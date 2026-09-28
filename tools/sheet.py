import asyncio, sys
from playwright.async_api import async_playwright
ids = sys.argv[1] if len(sys.argv) > 1 else ""
out = sys.argv[2] if len(sys.argv) > 2 else "/tmp/sheet.png"
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1520, "height": 900})
        errs = []
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.on("console", lambda m: errs.append("console:" + m.text) if m.type == "error" else None)
        await pg.goto("http://localhost:8765/tools/preview.html" + ("?ids=" + ids if ids else ""))
        await pg.wait_for_function("window.__done === true", timeout=20000)
        bad = await pg.eval_on_selector_all(".row b", "els=>els.filter(e=>e.textContent.includes('ERR')).map(e=>e.textContent)")
        await pg.screenshot(path=out, full_page=True)
        print("errors:", errs[:5], bad[:10])
        await b.close()
asyncio.run(main())
