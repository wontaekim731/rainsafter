/* POCR: PaddleOCR PP-OCRv5 한국어(글자 위치 찾기 det + 글자 읽기 rec)를 브라우저에서 (onnxruntime-web, 무료·Apache-2.0)
   테스트 주소에서만 씀. POCR.read(canvas) → {text, lines:[{t,conf,box:[x0,y0,x1,y1]}], words:[{text,confidence,bbox}]}
   파이썬 onnxocr(PaddleOCR 기본값)과 같은 설정: det 긴 변 960·32배수, 평균/표준편차 정규화(BGR 순서), 문턱 0.3, 상자 점수 0.5, 넓히기 1.6 / rec 높이 48, (x/255-0.5)/0.5 */
(function(){
const BASE=(window.POCR_BASE||'lib/pocr/');let LOAD=null;const M={};
async function load(){if(LOAD)return LOAD;LOAD=(async()=>{
  if(!window.ort){await new Promise((ok,no)=>{const s=document.createElement('script');s.src=BASE+'../ort/ort.wasm.min.js';s.onload=ok;s.onerror=()=>no(new Error('ort'));document.head.appendChild(s)})}
  ort.env.wasm.wasmPaths=new URL(BASE+'../ort/',location.href).href;ort.env.wasm.numThreads=1;try{ort.env.logLevel='error'}catch(e){}const opt={executionProviders:['wasm'],graphOptimizationLevel:'all',logSeverityLevel:3};
  const get=async f=>{const r=await fetch(BASE+f);if(!r.ok)throw new Error(f+' '+r.status);return new Uint8Array(await r.arrayBuffer())};
  M.K=(await (await fetch(BASE+'keys_kor.txt')).text()).split('\n');if(M.K[M.K.length-1]==='')M.K.pop();
  M.D=await ort.InferenceSession.create(await get('det.onnx'),opt);M.R=await ort.InferenceSession.create(await get('rec_kor.onnx'),opt);return M})().catch(e=>{LOAD=null;throw e});return LOAD}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
function rgba(c){return c.getContext('2d').getImageData(0,0,c.width,c.height).data}
async function det(src){const W=src.width,H=src.height,r=Math.max(W,H)>960?960/Math.max(W,H):1;
  const w=Math.max(32,Math.round(W*r/32)*32),h=Math.max(32,Math.round(H*r/32)*32),c=cv(w,h),g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,0,0,w,h);
  const a=rgba(c),n=w*h,t=new Float32Array(3*n),mean=[0.485,0.456,0.406],std=[0.229,0.224,0.225];
  for(let i=0;i<n;i++){const R=a[i*4],G=a[i*4+1],B=a[i*4+2];t[i]=(B/255-mean[0])/std[0];t[n+i]=(G/255-mean[1])/std[1];t[2*n+i]=(R/255-mean[2])/std[2]}   /* cv2 BGR 순서 */
  const out=await M.D.run({x:new ort.Tensor('float32',t,[1,3,h,w])}),P=out[Object.keys(out)[0]].data,bm=new Uint8Array(n);for(let i=0;i<n;i++)bm[i]=P[i]>0.3?1:0;
  const lab=new Int32Array(n),boxes=[],st=new Int32Array(n);let L=0;
  for(let i=0;i<n;i++){if(!bm[i]||lab[i])continue;L++;let sp=0;st[sp++]=i;lab[i]=L;let x0=w,y0=h,x1=0,y1=0,s=0,cnt=0;
    while(sp){const j=st[--sp],x=j%w,y=(j/w)|0;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;s+=P[j];cnt++;
      for(const k of [j-1,j+1,j-w,j+w]){if(k<0||k>=n)continue;if((k===j-1&&x===0)||(k===j+1&&x===w-1))continue;if(bm[k]&&!lab[k]){lab[k]=L;st[sp++]=k}}}
    const bw=x1-x0+1,bh=y1-y0+1;if(Math.min(bw,bh)<3||cnt<6)continue;if(s/cnt<0.5)continue;
    const d=bw*bh*1.6/(2*(bw+bh));boxes.push([Math.max(0,(x0-d)/w*W),Math.max(0,(y0-d)/h*H),Math.min(W,(x1+1+d)/w*W),Math.min(H,(y1+1+d)/h*H)])}
  boxes.sort((p,q)=>Math.abs(p[1]-q[1])<10*H/h?p[0]-q[0]:p[1]-q[1]);return boxes}
async function rec(src,b){const bw=b[2]-b[0],bh=b[3]-b[1];if(bw<2||bh<2)return null;const w=Math.max(8,Math.min(3200,Math.ceil(48*bw/bh))),c=cv(w,48),g=c.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,b[0],b[1],bw,bh,0,0,w,48);
  const a=rgba(c),n=w*48,t=new Float32Array(3*n);for(let i=0;i<n;i++){t[i]=(a[i*4+2]/255-0.5)/0.5;t[n+i]=(a[i*4+1]/255-0.5)/0.5;t[2*n+i]=(a[i*4]/255-0.5)/0.5}
  const out=await M.R.run({x:new ort.Tensor('float32',t,[1,3,48,w])}),o=out[Object.keys(out)[0]],[_,T,C]=o.dims,P=o.data;let s='',prev=-1,ps=0,pn=0;const ch=[];
  for(let i=0;i<T;i++){let m=0,mv=-1e9;for(let k=0;k<C;k++){const v=P[i*C+k];if(v>mv){mv=v;m=k}}
    if(m!==0&&m!==prev){const c2=m<=M.K.length?M.K[m-1]:' ';s+=c2;ps+=mv;pn++;ch.push({c:c2,x:b[0]+(i+0.5)/T*bw})}prev=m}   /* CTC: 0=빈칸, 1..N=사전, 마지막=띄어쓰기 */
  return {t:s,conf:pn?ps/pn:0,box:b,ch}}
async function read(src){await load();const B=await det(src),lines=[];for(const b of B){const r=await rec(src,b);if(r&&r.t.trim())lines.push(r)}
  const words=[];for(const l of lines){let cur=null;const flush=()=>{if(cur){words.push({text:cur.t,confidence:Math.round(l.conf*100),bbox:{x0:Math.max(l.box[0],cur.x0-6),y0:l.box[1],x1:Math.min(l.box[2],cur.x1+6),y1:l.box[3]}});cur=null}};
    for(const k of l.ch){if(/[\uAC00-\uD7A3]/.test(k.c)){if(!cur)cur={t:'',x0:k.x,x1:k.x};cur.t+=k.c;cur.x1=k.x}else flush()}flush()}   /* 한글 낱말 상자(수식 읽기에서 가릴 곳): 글자 시간 위치로 */
  return {text:lines.map(l=>l.t).join('\n'),lines:lines.map(l=>({t:l.t,conf:l.conf,box:l.box})),words}}
window.POCR={load,read};
})();
