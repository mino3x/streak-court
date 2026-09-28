import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" and "fonts" not in m.text and "ERR_TUNNEL" not in m.text else None)
        await pg.goto("http://localhost:8765/public/index.html")
        await pg.wait_for_timeout(1200)
        print("app visible:", await pg.is_visible("#app"), "| gate:", await pg.is_visible("#gate"), "| demo:", await pg.is_visible("#demo"), "| sync:", await pg.text_content("#sync"))
        print("blocks:", await pg.eval_on_selector_all(".bt", "e=>e.map(x=>x.textContent)"))
        # preview a drill
        await pg.click(".block:nth-child(2) summary"); await pg.wait_for_timeout(200)
        await pg.click(".block:nth-child(2) [data-preview]"); await pg.wait_for_timeout(700)
        print("preview title:", await pg.text_content("#m-title"))
        await pg.screenshot(path="/tmp/app-preview.png")
        await pg.click("#m-close")
        # timer
        await pg.click("[data-start='handles']"); await pg.wait_for_timeout(900)
        print("timer:", await pg.text_content("#t-name"), "| tag:", await pg.text_content("#t-tag"), "| stage hidden:", await pg.is_hidden("#t-stage"))
        nonblank = await pg.evaluate("""(()=>{const c=document.getElementById('t-canvas');const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<x.length;i+=16){if(x[i]<60)n++;}return n})()""")
        print("dark pixels in stage:", nonblank)
        for i in range(4): await pg.click("#t-skip")
        await pg.wait_for_timeout(600)
        await pg.screenshot(path="/tmp/app-timer.png")
        await pg.click("#t-video"); await pg.wait_for_timeout(400)
        print("video modal:", await pg.text_content("#m-title"), "| iframe:", await pg.eval_on_selector("#m-body iframe", "e=>e.src") if await pg.query_selector("#m-body iframe") else None, "| timer paused:", await pg.text_content("#t-play"))
        await pg.click("#m-close"); await pg.wait_for_timeout(200)
        print("after close:", await pg.text_content("#t-play"))
        # rest segment shows next-up
        await pg.click("#t-close")
        await pg.click("[data-start='athletic']"); await pg.wait_for_timeout(300)
        await pg.click("#t-skip"); await pg.wait_for_timeout(300)
        print("athletic seg2:", await pg.text_content("#t-name"), "| tag:", await pg.text_content("#t-tag"))
        await pg.click("#t-close")
        # complete the day by ticking
        for i in range(1, 6):
            await pg.click(f".block:nth-child({i}) [data-toggle]")
        await pg.wait_for_timeout(300)
        print("streak:", await pg.text_content(".streak-num b"), "| complete banner:", await pg.is_visible(".done-banner"))
        await pg.screenshot(path="/tmp/app-today.png", full_page=False)
        # unmapped names check
        missing = await pg.evaluate("""(async()=>{const {PROGRAM,HANDLES}=await import('./js/program.js');const {animFor}=await import('./js/drills.js');const m=[];const chk=(it)=>{if(it.t==='rest')return;const n=it.L?it.n+' · Left':it.n;if(!animFor(n))m.push(it.n);if(it.L&&!animFor(it.n+' · Right'))m.push(it.n+' R');};HANDLES.forEach(chk);for(const P of Object.values(PROGRAM)){P.warmup.forEach(chk);for(const D of Object.values(P.days))for(const b of ['athletic','strength','skill'])D[b].items.forEach(chk);}return [...new Set(m)];})()""")
        print("missing anims:", missing)
        print("errors:", errs)
        await b.close()
asyncio.run(main())
