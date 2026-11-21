import json,os
from pathlib import Path
from playwright.sync_api import sync_playwright
base=os.environ.get('SITE_URL','http://localhost:8096/');results=[]
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless=True);page=b.new_page()
 page.route('**/assets/js/firebase.js',lambda route:route.fulfill(path=str(Path(__file__).with_name('mock-firebase.js')),content_type='text/javascript'))
 page.goto(base+'community/');page.wait_for_selector('.news-card');assert page.locator('.news-card').count()==12;assert page.evaluate('window.xss') is None;page.locator('#next').click();page.wait_for_function("document.querySelector('#page-number').textContent==='2'");assert page.locator('.news-card').count()==1;results.append('13 news: 12+1 pagination; script title renders as text')
 page.goto(base+'admin/');page.wait_for_selector('#dashboard',state='visible');page.locator('#new-record').click();page.locator('#title').fill('테스트 뉴스');page.locator('#summary').fill('요약');page.locator('#body').fill('<script>window.xss=true</script>');page.locator('#published').check();page.locator('#editor-form button').click();page.wait_for_function("window.testData.news.some(x=>x.title==='테스트 뉴스')");assert page.evaluate('window.xss') is None;results.append('Admin news create and safe text rendering')
 card=page.locator('.record').filter(has=page.get_by_role('heading',name='테스트 뉴스',exact=True));card.get_by_role('button',name='비게시로 전환').click();page.wait_for_function("window.testData.news.find(x=>x.title==='테스트 뉴스').published===false");results.append('Admin unpublish saves published=false')
 page.locator('[data-tab=progress]').click();page.locator('#date').fill('2026.12');page.locator('#sortKey').fill('2026-12');page.locator('#text').fill('추진경과 검수');page.locator('#type').select_option('plan');page.locator('#editor-form button').click();page.wait_for_function("window.testData.progress.length===1");results.append('Admin progress create')
 page.locator('[data-tab=settings]').click();page.locator('#stage').fill('단계 검수');page.locator('#asOf').fill('2026.11');page.locator('#editor-form button').click();page.wait_for_function("window.testData.settings.length===1");results.append('Admin current stage save')
 info=page.evaluate("""async()=>{const {convertImage}=await import('../assets/js/admin.js');const c=document.createElement('canvas');c.width=2400;c.height=1800;const blob=await new Promise(r=>c.toBlob(r,'image/png'));const result=await convertImage(new File([blob],'test.png',{type:'image/png'}));const bitmap=await createImageBitmap(result);return {type:result.type,size:result.size,width:bitmap.width,height:bitmap.height}}""")
 assert info['type']=='image/webp' and info['width']==1600 and info['size']<1048576;results.append('Image conversion: '+json.dumps(info))
 b.close()
Path('/private/tmp/shinan-interaction-result.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print(json.dumps(results,ensure_ascii=False))
