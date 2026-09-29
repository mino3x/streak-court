import asyncio
from playwright.async_api import async_playwright
PLACEHOLDER = 'export const firebaseConfig = { apiKey: "REPLACE_WITH_API_KEY" };'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        # 1) real config: firebase unreachable from this sandbox, but the sign-in screen must render without errors
        pg = await (await b.new_context(viewport={"width": 390, "height": 844})).new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        await pg.goto("http://localhost:8765/public/index.html"); await pg.wait_for_timeout(2500)
        print("[live config] gate visible:", await pg.is_visible("#gate"), "| text:", await pg.text_content("#gate-text"), "| errors:", errs)
        # 2) demo mode via placeholder config: full flow incl. guide tab
        ctx = await b.new_context(viewport={"width": 390, "height": 844})
        await ctx.route("**/js/firebase-config.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body=PLACEHOLDER))
        pg2 = await ctx.new_page(); errs2 = []
        pg2.on("pageerror", lambda e: errs2.append("pageerror: " + str(e)))
        await pg2.goto("http://localhost:8765/public/index.html"); await pg2.wait_for_timeout(1200)
        print("[demo] app visible:", await pg2.is_visible("#app"), "| blocks:", len(await pg2.query_selector_all(".block")))
        await pg2.click("#tab-guide"); await pg2.wait_for_timeout(200)
        print("[demo] guide cards:", await pg2.eval_on_selector_all(".guide h3", "e=>e.map(x=>x.textContent)"))
        await pg2.click("#tab-today"); await pg2.click("[data-start='strength']"); await pg2.wait_for_timeout(800)
        print("[demo] strength timer:", await pg2.text_content("#t-name"), "| stage shown:", await pg2.is_visible("#t-stage"))
        print("[demo] errors:", errs2)
        await b.close()
asyncio.run(main())
