/* 수식 읽기 (무료 공개 모델 pix2tex/LaTeX-OCR, MIT · ONNX 변환 RapidLaTeXOCR, 8비트 양자화) — 문제 그림의 수식을 LaTeX로.
   한글 낱말(글자 인식으로 찾은 칸)은 지우고, 줄마다 잘라 읽는다. 첫 사용 때 모델 약 130MB를 받아 둔다(이후 캐시). */
(function(){
const BASE=(window.MOCR_BASE||'lib/mocr/');const MAXW=672,MAXH=192,MINW=32,MINH=32,MEAN=0.7931,STD=0.1738;
const M={};let LOAD=null;
function cv(w,h){const c=document.createElement('canvas');c.width=Math.max(1,w|0);c.height=Math.max(1,h|0);return c}
function gray(c){const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data,a=new Float32Array(c.width*c.height);for(let i=0,j=0;i<a.length;i++,j+=4)a[i]=Math.floor((d[j]*299+d[j+1]*587+d[j+2]*114)/1000);return a}
function fromGray(a,w,h){const c=cv(w,h),g=c.getContext('2d'),im=g.createImageData(w,h);for(let i=0,j=0;i<a.length;i++,j+=4){const v=a[i];im.data[j]=im.data[j+1]=im.data[j+2]=v;im.data[j+3]=255}g.putImageData(im,0,0);return c}
/* PIL과 같은 방식의 크기 바꾸기 (학습 때 쓴 파이썬과 같은 결과가 나오게): 줄일 때 Lanczos3, 늘릴 때 bilinear, 받침 폭은 배율만큼 넓힘 */
function rs1(src,sw,sh,dw,horiz,lanc){const out=new Float32Array(horiz?dw*sh:sw*dw),inN=horiz?sw:sh,sc=inN/dw,fs=Math.max(sc,1),sup=(lanc?3:1)*fs,ss=1/fs;
  const sinc=x=>x===0?1:Math.sin(Math.PI*x)/(Math.PI*x),f=x=>{x=Math.abs(x);return lanc?(x<3?sinc(x)*sinc(x/3):0):(x<1?1-x:0)};
  for(let o=0;o<dw;o++){const ce=(o+0.5)*sc;let a=Math.max(Math.floor(ce-sup+0.5),0),b=Math.min(Math.floor(ce+sup+0.5),inN);const k=[];let t=0;for(let i=a;i<b;i++){const v=f((i-ce+0.5)*ss);k.push(v);t+=v}
    if(!t)t=1;if(horiz){for(let y=0;y<sh;y++){let s=0;for(let i=a;i<b;i++)s+=src[y*sw+i]*k[i-a];out[y*dw+o]=s/t}}else{for(let x=0;x<sw;x++){let s=0;for(let i=a;i<b;i++)s+=src[i*sw+x]*k[i-a];out[o*sw+x]=s/t}}}
  return out}
function resizeG(a,sw,sh,dw,dh,lanc){let t=a;if(dw!==sw)t=rs1(t,sw,sh,dw,true,lanc);if(dh!==sh)t=rs1(t,dw,sh,dh,false,lanc);for(let i=0;i<t.length;i++)t[i]=Math.min(255,Math.max(0,Math.round(t[i])));return t}
function resize(c,w,h,lanc){w=Math.max(1,w|0);h=Math.max(1,h|0);if(w===c.width&&h===c.height)return c;return fromGray(resizeG(gray(c),c.width,c.height,w,h,lanc!==false),w,h)}
function pad(c){const w=c.width,h=c.height;let a=gray(c);let mn=255,mx=0;for(const v of a){if(v<mn)mn=v;if(v>mx)mx=v}const rg=Math.max(mx-mn,1);let s=0;for(let i=0;i<a.length;i++){a[i]=255*(a[i]-mn)/rg;s+=a[i]}
  const inv=s/a.length<=128;if(inv)for(let i=0;i<a.length;i++)a[i]=255-a[i];
  let x0=w,x1=-1,y0=h,y1=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(a[y*w+x]<128){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x1<0)return fromGray(a,w,h);const cw=x1-x0+1,ch=y1-y0+1,W=Math.ceil(cw/32)*32,H=Math.ceil(ch/32)*32,b=new Float32Array(W*H).fill(255);
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)b[y*W+x]=Math.floor(a[(y+y0)*w+x+x0]);return fromGray(b,W,H)}
function minmax(c){let w=c.width,h=c.height;if(w>MAXW||h>MAXH){const r=Math.min(MAXW/w,MAXH/h);c=resize(c,Math.max(1,Math.floor(w*r)),Math.max(1,Math.floor(h*r)));w=c.width;h=c.height}
  if(w<MINW||h<MINH){const o=cv(Math.max(w,MINW),Math.max(h,MINH)),g=o.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,o.width,o.height);g.drawImage(c,0,0);c=o}return c}
function tens(c){const a=gray(c),t=new Float32Array(a.length);for(let i=0;i<a.length;i++)t[i]=(a[i]/255-MEAN)/STD;return new ort.Tensor('float32',t,[1,1,c.height,c.width])}
async function load(){if(LOAD)return LOAD;LOAD=(async()=>{if(!window.ort){await new Promise((ok,no)=>{const s=document.createElement('script');s.src=BASE+'../ort/ort.wasm.min.js';s.onload=ok;s.onerror=()=>no(new Error('ort'));document.head.appendChild(s)})}
    ort.env.wasm.wasmPaths=new URL(BASE+'../ort/',location.href).href;ort.env.wasm.numThreads=1;const opt={executionProviders:['wasm'],graphOptimizationLevel:'all'};
    const get=async f=>{const r=await fetch(BASE+f);if(!r.ok)throw new Error(f+' '+r.status);return new Uint8Array(await r.arrayBuffer())};
    M.V=await (await fetch(BASE+'vocab.json')).json();
    M.R=await ort.InferenceSession.create(await get('image_resizer.q8.onnx'),opt);M.E=await ort.InferenceSession.create(await get('encoder.q8.onnx'),opt);M.D=await ort.InferenceSession.create(await get('decoder.q8.onnx'),opt);return M})().catch(e=>{LOAD=null;throw e});return LOAD}
async function latex(img,maxlen){await load();let r=1,w=img.width,x=null;
  for(let k=0;k<10;k++){const h=Math.max(1,Math.floor(w*img.height/img.width));let im=minmax(pad(minmax(resize(img,w,h,!(r>1)))));const t=tens(im);
    const o=await M.R.run({input:t});const d=o.output.data;let bi=0;for(let i=1;i<d.length;i++)if(d[i]>d[bi])bi=i;const nw=(bi+1)*32;x=t;if(nw===im.width)break;r=nw/im.width;w=nw}
  const ctx=(await M.E.run({input:x})).output;const out=[1n];
  for(let i=0;i<(maxlen||90);i++){const xs=new ort.Tensor('int64',BigInt64Array.from(out),[1,out.length]),mk=new ort.Tensor('bool',new Uint8Array(out.length).fill(1),[1,out.length]);
    const lg=(await M.D.run({x:xs,mask:mk,context:ctx})).output,V=lg.dims[2],off=(lg.dims[1]-1)*V,d=lg.data;let bi=0,bv=-1e30;for(let j=0;j<V;j++){const v=d[off+j];if(v>bv){bv=v;bi=j}}
    out.push(BigInt(bi));if(bi===2)break}
  return out.slice(1).map(Number).filter(t=>t>2).map(t=>M.V[t]||'').join('').replace(/Ġ/g,' ').trim()}
function lines(a,w,h){const dark=new Int32Array(h);for(let y=0;y<h;y++){let n=0;for(let x=0;x<w;x++)if(a[y*w+x]<150)n++;dark[y]=n}
  const th=Math.max(2,w*0.004),on=y=>dark[y]>th,L=[];let y=0;const gap=6,minh=14;
  while(y<h){if(on(y)){const s=y;while(y<h&&(on(y)||(y+1<h&&on(Math.min(h-1,y+gap))&&[...Array(gap).keys()].some(k=>y+k<h&&on(y+k)))))y++;if(y-s>=minh)L.push([Math.max(0,s-3),Math.min(h,y+3)])}y++}return L}
/* src: 문제 그림 canvas, words: 글자 인식 낱말 [{text,confidence,bbox:{x0,y0,x1,y1}}] (그 canvas 좌표) */
async function read(src,words,o){o=o||{};const sc=src.width>900?900/src.width:1;const c=resize(src,Math.round(src.width*sc),Math.round(src.height*sc)),g=c.getContext('2d');g.fillStyle='#fff';
  for(const wd of (words||[])){if(/[가-힣]/.test(wd.text||'')&&(wd.confidence||0)>40){const b=wd.bbox;g.fillRect(b.x0*sc,b.y0*sc,(b.x1-b.x0)*sc+1,(b.y1-b.y0)*sc+1)}}
  const a=gray(c),W=c.width,H=c.height,res=[];
  for(const [y0,y1] of lines(a,W,H).slice(0,o.maxLines||10)){if(y1-y0>120)continue;let cx0=W,cx1=-1;for(let y=y0;y<y1;y++)for(let x=0;x<W;x++)if(a[y*W+x]<150){if(x<cx0)cx0=x;if(x>cx1)cx1=x}
    if(cx1-cx0<5)continue;let n=0;for(let x=cx0;x<=cx1;x++){for(let y=y0;y<y1;y++)if(a[y*W+x]<150){n++;break}}if(n<6)continue;
    const x0=Math.max(0,cx0-4),x1=Math.min(W,cx1+5),seg=cv(x1-x0,y1-y0);seg.getContext('2d').drawImage(c,x0,y0,x1-x0,y1-y0,0,0,x1-x0,y1-y0);
    try{res.push(await latex(seg,90))}catch(e){console.error(e);break}if(o.onLine)o.onLine(res.length)}
  return res}
const JUNK=/\\(mathfrak|mathbb|mathsf|mathrm|operatorname|underline|tilde|bar|hat|textstyle|left|right|qquad|quad|mathop|overset|underset|begin|end|array|Phi|Theta|Omega|Xi|ddots|cdots|l|,|;|!)\b/g;
function tok(L){let s=(L||[]).join(' ').replace(JUNK,' ').replace(/[{}]/g,' ').replace(/\s+/g,' ');return (s.match(/\\[a-zA-Z]+|\^|_|[a-zA-Z]|\d+|[=+\-<>()|/]/g)||[]).join(' ')}
window.MOCR={load,read,latex,tok,ready:()=>!!M.D};
})();
