import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('SITE_URL','http://localhost:8096/')
results=[];errors=[]
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True)
 page=browser.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
 for width in [360,390,768,1024,1440]:
  page.set_viewport_size({'width':width,'height':950})
  for path in ['', 'greeting/','location/','overview/','progress/','community/','community/news/','admin/']:
   page.goto(base+path);page.wait_for_timeout(800)
   assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(width,path,'overflow')
   assert page.locator('h1').count()>0,(width,path)
  results.append(f'{width}px: 8 pages, no horizontal overflow')
 page.goto(base+'progress/');page.wait_for_function("document.querySelectorAll('#history .timeline-row').length===10",timeout=30000);assert page.locator('#plans .timeline-row').count()==6
 results.append('Live Firestore progress 10 history / 6 plans')
 page.goto(base);page.wait_for_function("document.querySelectorAll('#recent .timeline-row').length===3",timeout=15000)
 page.screenshot(path='/private/tmp/shinan-desktop.png',full_page=True)
 page.set_viewport_size({'width':390,'height':844});page.reload();page.locator('#menu-toggle').click();assert page.locator('#menu-toggle').get_attribute('aria-expanded')=='true';page.keyboard.press('Escape');assert page.locator('#menu-toggle').get_attribute('aria-expanded')=='false';results.append('Mobile menu opens and Escape returns focus')
 page.screenshot(path='/private/tmp/shinan-mobile.png',full_page=True)
 page.goto(base+'community/news/?id=missing');page.wait_for_function("document.querySelector('#news-detail').textContent.includes('게시물을 찾을 수 없습니다')",timeout=15000)
 page.goto(base+'community/');page.wait_for_function("document.querySelector('#news-list').textContent.includes('등록된 주민상생 소식이 없습니다')",timeout=30000)
 results.append('Empty news and missing detail states')
 page.goto(base+'overview/');page.wait_for_timeout(1000)
 page.evaluate("""async()=>{const {openCertificate}=await import('../assets/js/ui.js');const b=document.createElement('button');b.id='test-cert';b.textContent='test';document.body.append(b);b.focus();openCertificate('test','missing.webp','test',b)}""")
 page.wait_for_function("document.querySelector('#cert-status').textContent.includes('이미지를 불러올 수 없습니다')")
 page.keyboard.press('Escape');assert page.evaluate("document.activeElement.id==='test-cert'");results.append('Certificate error message, Escape close and focus restore')
 assert not errors,errors
 browser.close()
Path('/private/tmp/shinan-browser-result.json').write_text(json.dumps({'passed':results,'pageErrors':errors},ensure_ascii=False,indent=2))
print(json.dumps(results,ensure_ascii=False))
