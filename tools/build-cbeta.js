/* 클로즈드 베타(cbeta.html) 만들기: lite.html → 이름표 붙이고 JS·CSS·HTML 줄이기
   실행: npm i terser csso  →  node tools/build-cbeta.js  (저장소 루트에서) */
const fs=require('fs'),crypto=require('crypto'),{minify}=require('terser'),csso=require('csso');
(async()=>{let h=fs.readFileSync('lite.html','utf8');const n0=Buffer.byteLength(h);
  const R=(a,b)=>{if(!h.includes(a))throw new Error('못 찾음: '+a.slice(0,60));h=h.replace(a,b)};
  R(/<title>[^<]*<\/title>/.exec(h)[0],'<title>QLEAR Closed Beta</title>');
  R('<head>','<head><script>window.NJ_CB=1</script>');
  R('<b class="hlName">QLEAR</b>','<b class="hlName">QLEAR</b><span class="hlCb">CLOSED BETA</span>');
  R('.hlTag{',' .hlCb{margin-top:8px;padding:4px 10px;border-radius:999px;border:1px solid var(--accent,#6ee7a8);color:var(--accent,#6ee7a8);font-size:11px;font-weight:800;letter-spacing:.18em}.hlTag{');
  R(/v47\.\d+ · 가벼운 버전/.exec(h)[0],/v47\.\d+/.exec(/v47\.\d+ · 가벼운 버전/.exec(h)[0])[0]+' · Closed Beta');
  R("const lib=document.getElementById('pdflibSrc').textContent;","const lib='importScripts('+JSON.stringify(new URL('__PDFL__',location.href).href)+');';");
  /* 스크립트 */
  let PDFL='';const parts=[];let i=0,out='';const re=/<script(\s[^>]*)?>([\s\S]*?)<\/script>/g;let m;
  while((m=re.exec(h))){out+=h.slice(i,m.index);const at=m[1]||'';if(/\bsrc=/.test(at)||!m[2].trim()){out+=m[0]}else{
    const r=await minify(m[2],{compress:{passes:1,keep_fnames:true},mangle:{keep_fnames:true},keep_fnames:true,format:{comments:false,ascii_only:false}});
    /* 잘 안 바뀌는 큰 덩어리(PDF 라이브러리·글씨 인식 가중치)는 따로 파일로: 앱을 고쳐도 다시 받지 않게 */
    const ext=/pdflibSrc/.test(at)?'pdflib':/^\s*SV\.CNN=/.test(m[2])?'cnn':/^\s*SV\.NET=/.test(m[2])?'net':/^\s*window\.TPL=/.test(m[2])?'tpl':null;
    if(ext){const hs=crypto.createHash('md5').update(r.code).digest('hex').slice(0,8),f=`lib/cb-${ext}-${hs}.js`;/* 오프라인 일꾼(sw.js)이 lib/ 파일을 주소 ? 뒤를 무시하고 저장해 두므로, 내용이 바뀌면 파일 이름이 바뀌게 */for(const o of fs.readdirSync('lib'))if(o.startsWith('cb-'+ext+'-')||o==='cb-'+ext+'.js')if('lib/'+o!==f)fs.unlinkSync('lib/'+o);fs.writeFileSync(f,r.code);if(ext==='pdflib')PDFL=f;out+=`<script src="${f}"></script>`}
    else out+=`<script${at}>${r.code}</script>`}i=re.lastIndex}
  h=out+h.slice(i);h=h.split('__PDFL__').join(PDFL);
  /* 스타일 */
  h=h.replace(/<style([^>]*)>([\s\S]*?)<\/style>/g,(_,a,c)=>`<style${a}>${csso.minify(c,{restructure:false}).css}</style>`);
  /* 태그 사이 공백 (스크립트·스타일 밖) */
  h=h.split(/(<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>)/).map((s,k)=>k%2?s:s.replace(/<!--(?!\[)[\s\S]*?-->/g,'').replace(/>\s+</g,'><').replace(/\n\s*/g,'\n')).join('');
  fs.writeFileSync('cbeta.html',h);console.log('lite',n0,'→ cbeta',Buffer.byteLength(h))})().catch(e=>{console.error(e);process.exit(1)});
