# End-to-end check of the app in demo mode (Firebase config swapped for placeholders).
import asyncio, json, sys, datetime
from playwright.async_api import async_playwright
OUT = sys.argv[1] if len(sys.argv) > 1 else "/tmp"
DEMO_CFG = 'export const firebaseConfig = { apiKey: "REPLACE_ME", authDomain: "", projectId: "", appId: "" };'

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2)
        await ctx.route("**/js/firebase-config.js", lambda r: r.fulfill(status=200, content_type="text/javascript", body=DEMO_CFG))
        await ctx.route("**/fonts.googleapis.com/**", lambda r: r.abort())
        pg = await ctx.new_page()
        errs = []
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.on("console", lambda m: errs.append("console: " + m.text) if m.type == "error" else None)
        await pg.goto("http://localhost:8765/public/index.html")
        await pg.wait_for_timeout(800)
        print("onboard visible:", await pg.is_visible("#onboard"), "| app:", await pg.is_visible("#app"))
        await pg.screenshot(path=OUT + "/t-onboard.png", full_page=True)
        # validation
        await pg.click("#pf-save"); print("empty submit ->", await pg.text_content("#pf-err"))
        await pg.fill("#pf-nick", "anjing123"); await pg.click("#pf-save"); print("bad nick ->", await pg.text_content("#pf-err"))
        await pg.fill("#pf-nick", "Rocket J"); await pg.click("[data-age='12']"); await pg.click("[data-av='shark']")
        print("nick kept after age click:", await pg.input_value("#pf-nick"))
        await pg.click("#pf-save"); print("no consent ->", await pg.text_content("#pf-err"))
        await pg.check("#pf-consent"); await pg.click("#pf-save"); await pg.wait_for_timeout(500)
        print("app visible:", await pg.is_visible("#app"), "| me:", await pg.text_content("#meBtn"), "| group:", await pg.get_attribute("html", "data-group"))
        print("day:", await pg.text_content(".dayno"), "| title:", await pg.text_content(".daytitle h2"))
        print("tabs:", await pg.eval_on_selector_all(".tab", "e=>e.map(x=>x.textContent)"))
        print("blocks:", await pg.eval_on_selector_all(".bt", "e=>e.map(x=>x.textContent)"))
        await pg.screenshot(path=OUT + "/t-today.png", full_page=True)
        # timer + animation + video
        await pg.click("[data-start='handles']"); await pg.wait_for_timeout(800)
        print("timer:", await pg.text_content("#t-name"), "| stage hidden:", await pg.is_hidden("#t-stage"))
        dark = await pg.evaluate("""(()=>{const c=document.getElementById('t-canvas');const x=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<x.length;i+=16){if(x[i]<60)n++;}return n})()""")
        print("dark px:", dark)
        await pg.click("#t-video"); await pg.wait_for_timeout(300)
        print("video modal:", await pg.text_content("#m-title"), "| paused:", await pg.text_content("#t-play"))
        await pg.click("#m-close"); await pg.click("#t-close")
        # score before blocks
        await pg.fill("#score-today", "9"); await pg.click("[data-savescore]"); await pg.wait_for_timeout(200)
        print("xp after score:", await pg.text_content(".xpcard"))
        for bid in ["warmup", "athletic", "handles", "skill", "strength"]:
            await pg.click(f"[data-toggle='{bid}']"); await pg.wait_for_timeout(80)
        await pg.wait_for_timeout(300)
        print("done banner:", await pg.is_visible(".done-banner"), "| xp:", await pg.text_content(".xpcard"))
        print("hero:", (await pg.text_content("#hero"))[:160])
        await pg.screenshot(path=OUT + "/t-today-done.png", full_page=True)
        # weekly bonus: tick one, run another with the timer
        await pg.click("[data-bonus='pushups']"); await pg.wait_for_timeout(200)
        print("bonus chip:", await pg.text_content(".bonuscard .chip"), "| done rows:", await pg.eval_on_selector_all(".brow2.done", "e=>e.length"))
        await pg.click("[data-bstart='plank']"); await pg.wait_for_timeout(300)
        print("bonus timer:", await pg.text_content("#t-block"), "|", await pg.text_content("#t-name"))
        for i in range(20):
            if await pg.is_visible("#t-finish"): break
            await pg.click("#t-skip")
        await pg.wait_for_timeout(200)
        print("bonus finish:", await pg.text_content("#t-finish"))
        await pg.click("[data-fin='close']"); await pg.wait_for_timeout(200)
        print("bonus chip after timer:", await pg.text_content(".bonuscard .chip"), "| hero xp:", await pg.text_content(".streak-sub"))
        await pg.click("[data-bpreview='kayang']"); await pg.wait_for_timeout(500)
        print("bonus preview:", await pg.text_content("#m-title"))
        await pg.screenshot(path=OUT + "/t-bonus-preview.png")
        await pg.click("#m-close")
        bc = await pg.query_selector(".bonuscard"); await bc.scroll_into_view_if_needed()
        await pg.screenshot(path=OUT + "/t-bonus.png")
        # leaderboard
        await pg.click("[data-tab='board']"); await pg.wait_for_timeout(400)
        print("board week:", await pg.eval_on_selector_all(".brow", "e=>e.map(x=>x.innerText.replace(/\\n/g,' | '))"))
        await pg.click("[data-bkind='all']"); await pg.wait_for_timeout(300)
        await pg.click("[data-bfilter='12-15']"); await pg.wait_for_timeout(200)
        print("board all 12-15:", await pg.eval_on_selector_all(".brow b", "e=>e.map(x=>x.textContent)"))
        await pg.click("[data-bfilter='all']"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=OUT + "/t-board.png", full_page=True)
        # program
        await pg.click("[data-tab='program']"); await pg.wait_for_timeout(300)
        print("cells:", await pg.eval_on_selector_all(".cell", "e=>e.length"), "| done cells:", await pg.eval_on_selector_all(".cell.done", "e=>e.length"), "| cur:", await pg.eval_on_selector_all(".cell.cur", "e=>e.map(x=>x.textContent)"))
        print("done badges:", await pg.eval_on_selector_all(".cell.done .cbadge.ok", "e=>e.length"), "| next:", await pg.eval_on_selector_all(".cell.cur", "e=>e.map(x=>x.textContent)"), "| locked:", await pg.eval_on_selector_all(".cell.locked", "e=>e.length"))
        await pg.click("[data-mapday='48']", force=True); await pg.wait_for_timeout(300)
        print("click locked 48 -> toast:", await pg.text_content(".toast"), "| detail still:", await pg.text_content(".mapday .dayno"))
        await pg.click("[data-mapday='1']"); await pg.wait_for_timeout(300)
        print("open done day 1:", await pg.text_content(".mapday .dayno"), "|", await pg.text_content(".mapday p.small"))
        await pg.click("[data-mapday='2']"); await pg.wait_for_timeout(300)
        print("open next day 2:", await pg.text_content(".mapday .dayno"), "|", await pg.text_content(".mapday h2"), "| blocks:", await pg.eval_on_selector_all(".mapday .bt", "e=>e.map(x=>x.textContent)"))
        await pg.screenshot(path=OUT + "/t-program.png", full_page=True)
        await pg.click(".mapday .block:nth-child(3) summary"); await pg.wait_for_timeout(100)
        await pg.click(".mapday .block:nth-child(3) [data-preview]"); await pg.wait_for_timeout(600)
        print("preview:", await pg.text_content("#m-title"))
        await pg.screenshot(path=OUT + "/t-preview.png")
        await pg.click("#m-close")
        await pg.click(".mapday [data-start='handles']"); await pg.wait_for_timeout(300)
        for i in range(40):
            if await pg.is_visible("#t-finish"): break
            await pg.click("#t-skip")
        await pg.wait_for_timeout(300)
        print("preview finish:", await pg.text_content("#t-finish"))
        await pg.click("[data-fin='close']")
        # progress + guide
        await pg.click("[data-tab='progress']"); await pg.wait_for_timeout(200)
        print("progress stats:", await pg.eval_on_selector_all(".stat", "e=>e.map(x=>x.innerText.replace(/\\n/g,' '))"))
        await pg.screenshot(path=OUT + "/t-progress.png", full_page=True)
        await pg.click("[data-tab='guide']"); await pg.wait_for_timeout(200)
        print("guide targets:", await pg.eval_on_selector_all(".compare thead th", "e=>e.map(x=>x.textContent)"))
        # profile edit: switch to age 11
        await pg.click("#meBtn"); await pg.wait_for_timeout(200)
        await pg.click("#m-body [data-age='11']"); await pg.click("#m-body [data-av='fox']"); await pg.click("#m-body #pf-save"); await pg.wait_for_timeout(300)
        print("after edit group:", await pg.get_attribute("html", "data-group"), "| me:", await pg.text_content("#meBtn"))
        # simulate 20 finished days, reload
        await pg.evaluate("""(()=>{
          const logs = JSON.parse(localStorage.getItem('sc.demo.logs')||'{}');
          const d = new Date(); let n = 0, k = 1;
          while (n < 20) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() - k); k++;
            if (x.getDay()===0||x.getDay()===6) continue;
            const key = x.getFullYear()+'-'+String(x.getMonth()+1).padStart(2,'0')+'-'+String(x.getDate()).padStart(2,'0');
            logs['demo_'+key] = {uid:'demo',date:key,day:20-n,group:'10-11',mode:'full',blocks:{warmup:true,athletic:true,handles:true,skill:true,strength:true},score:{id:'hotspot60',value:5+n%4},tests:{},complete:true,xp:70,parts:{}}; n++; }
          localStorage.setItem('sc.demo.logs', JSON.stringify(logs));
        })()""")
        await pg.reload(); await pg.wait_for_timeout(700)
        print("after reload day:", await pg.text_content(".dayno"), "| hero:", (await pg.text_content("#hero"))[:140])
        await pg.screenshot(path=OUT + "/t-today-day21.png", full_page=True)
        # delete data
        await pg.click("#meBtn"); await pg.click("[data-act='delete']"); await pg.click("[data-act='delete']"); await pg.wait_for_timeout(500)
        print("after delete onboard:", await pg.is_visible("#onboard"))
        # viewer mode
        await pg.click("#ob-viewer"); await pg.wait_for_timeout(300)
        print("viewer app:", await pg.is_visible("#app"), "| tabs:", await pg.eval_on_selector_all(".tab", "e=>e.map(x=>x.textContent)"), "| me:", await pg.text_content("#meBtn"))
        await pg.click("[data-vgroup='12-15']"); await pg.wait_for_timeout(200)
        print("viewer map title:", await pg.text_content(".mapday h2"), "| group:", await pg.get_attribute("html", "data-group"), "| locked cells:", await pg.eval_on_selector_all(".cell.locked", "e=>e.length"))
        await pg.click("[data-mapday='48']"); await pg.wait_for_timeout(300)
        print("viewer opens day 48:", await pg.text_content(".mapday .dayno"), "|", await pg.text_content(".mapday h2"))
        print("viewer bonus list:", await pg.eval_on_selector_all(".bonuscard .bn b", "e=>e.map(x=>x.textContent)"), "| toggles:", await pg.eval_on_selector_all(".bonuscard [data-bonus]", "e=>e.length"))
        await pg.screenshot(path=OUT + "/t-viewer.png", full_page=True)
        print("errors:", errs)
        await b.close()
asyncio.run(main())
