import json
from pathlib import Path
from playwright.sync_api import sync_playwright
results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True);page=b.new_page()
 for path in ['', 'greeting/','location/','overview/','progress/','community/','community/news/','admin/']:
  page.goto('http://localhost:8096/'+path);page.wait_for_timeout(500);page.add_script_tag(path='/private/tmp/shinan-axe.js');r=page.evaluate("async()=>await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})");issues=[{'id':v['id'],'impact':v['impact'],'nodes':[n['target'] for n in v['nodes']]} for v in r['violations']];results.append({'page':path,'violations':issues})
 b.close()
Path('/private/tmp/shinan-axe-result.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))
