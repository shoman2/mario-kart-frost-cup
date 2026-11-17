'use strict';

const $ = id => document.getElementById(id);
const el = Object.fromEntries(['game','stage','sound','restart','pause','lap','menu','menu-title','menu-caption','start','start-hint','countdown','drive-hud','speed','item','timer','touch','drivers','rankings','rank-state','map'].map(id=>[id,$(id)]));
const canvas = el.game, ctx=canvas.getContext('2d',{alpha:false});
const W=canvas.width,H=canvas.height, HALFW=23, LAPS=3, HORIZON=156, NEAR=4.5, FOCAL=292;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)), lerp=(a,b,t)=>a+(b-a)*t, mod=(n,m)=>((n%m)+m)%m;
const hash=n=>{ const x=Math.sin(n*127.1+311.7)*43758.5453123; return x-Math.floor(x); };
const length=(x,y)=>Math.hypot(x,y), pad=(n)=>String(n).padStart(2,'0');
const better=(t)=>Math.floor(t/60)+':'+pad(Math.floor(t)%60)+'.'+pad(Math.floor(t*100)%100);
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
function read(key,fallback){try{return localStorage.getItem('frost-cup-'+key)??fallback;}catch{return fallback;}}
function write(key,value){try{localStorage.setItem('frost-cup-'+key,value);}catch{}}

const drivers=[
  {name:'마리오', color:'#ff6269', dark:'#ad2c4f', light:'#ffb097', max:146, steer:1.00, accel:1.00},
  {name:'루이지',color:'#60db8d', dark:'#288065', light:'#b6f695', max:143, steer:1.12, accel:1.00},
  {name:'피치',color:'#ff91cb', dark:'#bc4b8f', light:'#ffbedf', max:141, steer:1.07, accel:1.11},
  {name:'키노피오',color:'#f8a76d', dark:'#c56d49', light:'#ffe194', max:138, steer:1.15, accel:1.16},
  {name:'요시',color:'#b9ed6e', dark:'#5c9e43', light:'#ddff9f', max:145, steer:1.03, accel:1.04},
  {name:'쿠파',color:'#ffd16b', dark:'#c77636', light:'#fff2a3', max:151, steer:.90, accel:.93},
];
const outline='#263048', skin='#ffbc89', skinShade='#e98164', white='#fff4ee', black='#302241';
function portrait(id,back=false){
  const c=document.createElement('canvas');c.width=c.height=24;
  const p=c.getContext('2d');const r=(x,y,w,h,color)=>{p.fillStyle=color;p.fillRect(x,y,w,h);};
  const d=drivers[id];
  if(id<=1){
    r(5,5,14,15,outline);r(3,8,18,9,outline);r(7,3,10,3,outline);r(6,4,12,5,d.color);r(4,7,16,3,d.color);r(5,10,14,2,d.dark);
    r(5,12,14,6,back?'#643e3a':skin);r(7,18,10,2,back?'#513641':skinShade);r(4,14,2,3,skinShade);r(18,14,2,3,skinShade);
    if(!back){r(10,5,4,4,white);r(11,6,2,2,d.dark);r(8,12,2,2,black);r(14,12,2,2,black);r(8,15,8,2,black);r(10,14,4,2,'#ffd4a2');r(10,18,4,1,white);}
    r(5,20,14,3,d.dark);r(8,20,8,4,'#526fcd');r(8,21,2,1,'#ffd687');r(14,21,2,1,'#ffd687');
  }else if(id===2){
    r(5,6,14,15,outline);r(4,10,16,10,'#b87446');r(6,7,12,9,'#e7a853');r(7,7,10,5,'#ffe493');r(7,12,10,7,back?'#df9850':skin);r(9,19,6,2,skinShade);
    r(7,4,10,4,'#ffd465');r(6,3,2,3,'#ffe792');r(11,2,2,4,'#ffe792');r(16,3,2,3,'#ffe792');r(11,5,2,2,'#e7608c');r(5,16,2,2,'#7fe2ff');r(17,16,2,2,'#7fe2ff');
    if(!back){r(8,13,2,2,'#5e71ad');r(14,13,2,2,'#5e71ad');r(11,17,2,1,'#bd5975');}
    r(7,21,10,3,d.color);r(11,21,2,2,'#b0f3ff');
  }else if(id===3){
    r(6,3,12,3,outline);r(3,6,18,10,outline);r(5,15,14,8,outline);r(6,4,12,3,white);r(4,7,16,8,white);
    r(5,7,4,5,'#e85969');r(14,5,4,5,'#ee6774');r(16,12,4,3,'#e85969');r(6,15,12,2,'#d5b9c2');r(7,16,10,5,skin);
    if(!back){r(9,17,1,2,black);r(14,17,1,2,black);r(11,20,2,1,'#ba654e');}
    r(6,22,12,2,'#6384d2');r(9,22,6,2,white);
  }else if(id===4){
    r(6,3,10,3,outline);r(4,6,15,15,outline);r(13,11,8,8,outline);r(6,5,11,12,'#74bc4b');r(5,8,4,6,'#4e8c4a');r(8,6,8,6,back?'#97db62':white);
    r(13,11,6,6,'#a0de59');r(14,12,5,3,'#c0ec74');r(8,15,10,5,'#e4f4d1');r(8,19,8,4,'#74bc4b');r(9,21,6,3,'#e4f4d1');
    r(5,10,2,3,'#e77b64');r(5,14,2,3,'#e77b64');if(!back){r(11,8,2,3,black);r(15,8,1,3,black);r(17,12,1,1,'#578c46');}
  }else{
    r(5,5,14,15,outline);r(3,10,18,9,outline);r(4,4,3,6,white);r(17,4,3,6,white);
    r(7,4,10,7,'#e98354');r(9,3,6,4,'#ffc06a');r(5,9,14,7,'#7fae50');r(4,14,16,5,'#eac060');r(6,17,12,4,'#ffde88');
    if(!back){r(7,11,3,2,white);r(14,11,3,2,white);r(9,11,1,2,black);r(14,11,1,2,black);r(9,16,6,1,'#a96843');r(7,17,2,2,white);r(15,17,2,2,white);}
    r(5,21,14,3,'#639955');r(9,21,6,2,'#c8e081');
  }
  return c;
}
drivers.forEach((d,i)=>{d.face=portrait(i);d.profile=d.face.toDataURL();d.back=portrait(i,true);});

const points=[[0,0],[0,175],[37,334],[167,435],[325,400],[435,281],[423,147],[312,99],[262,13],[340,-94],[278,-199],[139,-215],[27,-165],[0,-81]];
function catmull(p0,p1,p2,p3,t){
  return .5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t);
}
const circuit=[];let total=0;
for(let i=0;i<points.length;i++)for(let j=0;j<44;j++){
  const a=points[mod(i-1,points.length)],b=points[i],c=points[(i+1)%points.length],d=points[(i+2)%points.length],t=j/44;
  const x=catmull(a[0],b[0],c[0],d[0],t),z=catmull(a[1],b[1],c[1],d[1],t);
  if(circuit.length){const prev=circuit[circuit.length-1];total+=length(x-prev.x,z-prev.z);}
  circuit.push({x,z,s:total});
}
const last=circuit[circuit.length-1];total+=length(last.x,last.z);
circuit.push({x:0,z:0,s:total});
function position(s){
  s=mod(s,total);
  let lo=0,hi=circuit.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(circuit[m].s<=s)lo=m;else hi=m;}
  const a=circuit[lo],b=circuit[hi],dx=b.x-a.x,dz=b.z-a.z;
  const t=(s-a.s)/(b.s-a.s),l=length(dx,dz);
  return {x:a.x+dx*t,z:a.z+dz*t,nx:dz/l,nz:-dx/l,dx:dx/l,dz:dz/l};
}
function pick(s,x){const p=position(s);return {x:p.x+p.nx*x,z:p.z+p.nz*x};}
const elements=[];
function prop(s,x,type,seed=0){elements.push({s:mod(s,total),x,type,seed});}
for(let s=8;s<total;s+=8){
  const seed=Math.round(s/8);
  for(const sign of [-1,1]){
    const r=hash(seed*2+(sign>0?13:141));
    if(r<.73)prop(s+hash(seed+270)*4,sign*(29+r*17),r<.37?'tree':r<.49?'pine':r<.57?'cane':r<.65?'gift':'pine',seed+(sign>0?0:57));
    if(r>.87)prop(s,sign*(51+r*12),'pine',seed+555);
  }
}
for(const [s,x,type,seed] of [[5,-36,'tree',19],[14,32,'tree',74],[26,-28,'cane',19],[46,33,'snowman',19],[63,-58,'cabin',49],[85,-43,'cabin',76],[104,49,'cabin',12],[124,42,'cabin',33],[117,-29,'cane',44],[149,32,'tree',23],[140,-62,'cabin',7],[176,44,'cabin',52],[370,-34,'snowman',34],[640,38,'cabin',63],[915,-40,'cabin',88],[1315,36,'snowman',90]])prop(s,x,type,seed);
const itemStations=[144,418,705,1045,1360].filter(s=>s<total-45);
const boostStations=[270,560,860,1190,1490].filter(s=>s<total-35).map((s,i)=>({s,x:[-10,12,0,10,-12][i]}));
const checker=[-1,1];

class ChipTunes{
  constructor(){this.muted=read('muted','0')==='1';this.ac=null;this.step=0;}
  unlock(){
    if(this.muted)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)return;
    if(!this.ac){
      try{
        this.ac=new Audio();this.out=this.ac.createGain();this.out.gain.value=.35;this.out.connect(this.ac.destination);
      }catch{return;}
    }
    if(this.ac.state==='suspended')this.ac.resume().catch(()=>{});
  }
  note(midi,len,volume,type='square',when=this.ac?.currentTime){
    if(!this.ac||this.muted||this.ac.state!=='running')return;
    const o=this.ac.createOscillator(),g=this.ac.createGain(),start=Math.max(this.ac.currentTime,when);
    o.type=type;o.frequency.value=440*2**((midi-69)/12);o.connect(g);g.connect(this.out);
    g.gain.setValueAtTime(0,start);g.gain.linearRampToValueAtTime(volume,start+.008);g.gain.exponentialRampToValueAtTime(.001,start+len);o.start(start);o.stop(start+len+.02);
  }
  tune(on){
    if(!on||!this.ac||this.muted||this.ac.state!=='running'){this.nextBeat=0;return;}
    const t=this.ac.currentTime;
    if(!this.nextBeat||t-this.nextBeat>.3)this.nextBeat=t+.015;
    const melody=[76,0,76,77,79,0,83,79,81,0,77,76,74,0,72,0,74,0,76,74,79,0,81,83,84,81,77,0,79,74,76,0,76,79,84,0,83,79,76,0,77,81,86,0,84,81,77,0,79,83,86,83,88,86,84,81,79,76,74,0,72,0,0,0];
    const bass=[48,55,52,55,53,60,57,60,50,57,53,57,55,62,59,62];
    while(this.nextBeat<t+.115){
      const s=this.step++,n=melody[s%melody.length];
      if(n){this.note(n,.104,.07,'square',this.nextBeat);if(s%8===0)this.note(n+12,.058,.023,'sine',this.nextBeat);}
      if(s%2===0)this.note(bass[(s>>1)%bass.length],.15,.19,'triangle',this.nextBeat);
      if(s%4===2)this.note(94,.025,.045,'triangle',this.nextBeat);
      this.nextBeat+=.148;
    }
  }
  effect(type){
    if(!this.ac)return;
    const t=this.ac.currentTime;
    const sounds={select:[67,79],count:[76],go:[84,96],item:[72,76,81,88],boost:[67,74,79,86],hit:[49,46,39],lap:[76,81,84],win:[72,76,79,84,88],finish:[72,76,79,76]};
    (sounds[type]||[]).forEach((n,i)=>this.note(n,type==='count'?.15:.13,.21,i%2?'triangle':'square',t+i*.072));
  }
  toggle(){this.muted=!this.muted;write('muted',this.muted?'1':'0');if(!this.muted)this.unlock();if(this.out){this.out.gain.cancelScheduledValues(this.ac.currentTime);this.out.gain.setTargetAtTime(this.muted?0:.35,this.ac.currentTime,.012);}return this.muted;}
}
const audio=new ChipTunes();

let selected=clamp(Number(read('driver',0))||0,0,5)|0;
let mode='ready',previous='racing',karts=[],player, raceTime=0, count=0, goFlash=0, lastBeep=0, uiTick=0, camera, clock=0, finishPlace=0, best=0,newBest=false, slots=[], fx=[];
const keys=new Set();
const has=(...codes)=>codes.some(k=>keys.has(k));
function reset(){
  const order=[selected,...drivers.map((_,i)=>i).filter(i=>i!==selected)];
  karts=order.map((id,i)=>({id,s:-40+i*7,x:[0,-10,9,-10,9,0][i],v:0,lat:0,boost:0,stun:0,drift:0,item:null,collected:new Set(),place:0,done:false,lap:1,slip:false,seed:hash(id+51)}));
  player=karts[0];mode='ready';raceTime=0;count=0;goFlash=0;finishPlace=0;newBest=false;best=Number(read('best',0))||0;fx=[];keys.clear();refresh(true);
}
function start(){
  reset();el.stage.focus({preventScroll:true});audio.unlock();mode='countdown';count=3;lastBeep=3;audio.effect('count');refresh(true);
}
function pause(){
  if(mode==='countdown'||mode==='racing'){previous=mode;mode='paused';keys.clear();audio.tune(false);refresh(true);}
  else if(mode==='paused'){mode=previous;el.stage.focus({preventScroll:true});audio.unlock();refresh(true);}
}
function orderKarts(){return [...karts].sort((a,b)=>a.place&&b.place?a.place-b.place:a.place?-1:b.place?1:b.s-a.s);}
function finish(){
  finishPlace=player.place;
  if(!best||raceTime<best){best=raceTime;newBest=true;write('best',best);}
  mode='finished';audio.effect(finishPlace===1?'win':'finish');keys.clear();refresh(true);
}
function useItem(){
  if(mode!=='racing'||!player.item)return;
  if(player.item==='boost'){player.boost=Math.max(player.boost,1.7);audio.effect('boost');}
  else{
    const targets=karts.filter(k=>k!==player&&!k.done).sort((a,b)=>a.s-b.s);
    const target=targets.find(k=>k.s>player.s&&k.s-player.s<120)||targets.reverse().find(k=>player.s-k.s<50&&k.s<player.s);
    if(target){fx.push({type:'ball',life:.44,total:.44,s:player.s,x:player.x,target});}
    else{player.boost=Math.max(player.boost,.65);}
    audio.effect('item');
  }
  player.item=null;refresh(false);
}
function pass(s,before,spot){return Math.floor((s-spot)/total)>Math.floor((before-spot)/total);}
function update(dt){
  if(mode==='countdown'){
    count-=dt;const now=Math.ceil(count);
    if(now>0&&now<lastBeep){lastBeep=now;audio.effect('count');}
    if(count<=0){mode='racing';goFlash=.7;audio.effect('go');refresh(true);}
    return;
  }
  if(mode!=='racing')return;
  raceTime+=dt;goFlash=Math.max(0,goFlash-dt);
  for(const k of karts){
    if(k.done)continue;
    const isSelf=k===player,d=drivers[k.id],before=k.s;
    k.boost=Math.max(0,k.boost-dt);k.stun=Math.max(0,k.stun-dt);
    const loose=Math.abs(k.x)>HALFW-1;
    if(isSelf){
      const gas=has('ArrowUp','KeyW'),brake=has('ArrowDown','KeyS');
      const steer=Number(has('ArrowRight','KeyD'))-Number(has('ArrowLeft','KeyA'));
      k.slip=has('ShiftLeft','ShiftRight')&&k.v>46&&!!steer&&!loose;
      if(k.slip)k.drift=Math.min(1.6,k.drift+dt);
      else if(k.drift){if(k.drift>.46&&!loose){k.boost=Math.max(k.boost,k.drift>1.05?1.24:.70);audio.effect('boost');}k.drift=0;}
      const cap=(k.boost?d.max*1.28:d.max)*(loose?.56:1)*(k.stun?.60:1);
      const a=k.boost?102:gas?64*d.accel:brake?-112:-31;
      k.v=clamp(k.v+a*dt,0,Math.max(cap,k.v-(loose?200:95)*dt));
      const gain=(k.slip?48:34)*d.steer*clamp(k.v/74,0,1);
      const center=position(k.s),ahead=position(k.s+Math.max(6,k.v*.35));
      const curve=ahead.dx*center.nx+ahead.dz*center.nz;
      const slide=steer*gain+curve*-k.v*(k.slip?.34:.23);
      k.lat=lerp(k.lat,slide,Math.min(1,dt*(k.slip?3.1:6.6)));
      k.x+=k.lat*dt;
      if(Math.abs(k.x)>HALFW+8){k.x=Math.sign(k.x)*(HALFW+8);k.lat=-k.lat*.35;if(k.v>68)k.v*=.91;}
    }else{
      const lane=[0,-11,10,-5,6,0][k.id]+Math.sin(k.s*.018+k.seed*12)*5;
      const around=karts.find(o=>o!==k&&o.s>k.s&&o.s-k.s<15&&Math.abs(o.x-k.x)<5);
      const goal=clamp(lane+(around?(k.x<around.x?-8:8):0),-18,18);
      k.lat=lerp(k.lat,clamp((goal-k.x)*3,-27,27),dt*4);
      k.x+=k.lat*dt;
      const target=(100+k.seed*34+Math.sin(k.s*.014+k.id)*6+(k.boost?20:0))*(k.stun?.48:1);
      k.v=lerp(k.v,target,dt*(k.stun?7:1.14));
    }
    k.s+=k.v*dt;
    if(isSelf){
      for(let i=0;i<itemStations.length;i++){
        const at=itemStations[i],itemLap=Math.floor((at+Math.floor((k.s-at)/total)*total)/total);
        const hit=Math.min(...[-14,0,14].map(x=>Math.abs(x-k.x)))<=5.5;
        const code=itemLap*10+i;
        if(pass(k.s,before,at)&&hit&&!k.item&&!k.collected.has(code)){
          k.collected.add(code); k.item=(itemLap+i)%3===2?'snowball':'boost';audio.effect('item');
        }
      }
    }
    for(const pad of boostStations){
      if(pass(k.s,before,pad.s)&&Math.abs(k.x-pad.x)<8){k.boost=Math.max(k.boost,1.15);if(isSelf)audio.effect('boost');}
    }
    const lap=clamp(1+Math.floor(k.s/total),1,LAPS);
    if(lap>k.lap&&isSelf)audio.effect('lap');
    k.lap=lap;
    if(k.s>=total*LAPS){k.s=total*LAPS;k.done=true;k.place=karts.filter(o=>o.done).length;if(isSelf)finish();}
  }
  for(let i=0;i<karts.length;i++)for(let j=i+1;j<karts.length;j++){
    const a=karts[i],b=karts[j],ds=a.s-b.s,dx=a.x-b.x;
    if(!a.done&&!b.done&&Math.abs(ds)<4.5&&Math.abs(dx)<4){
      const push=Math.sign(dx||ds||1)*7*dt;a.x=clamp(a.x+push,-31,31);b.x=clamp(b.x-push,-31,31);
      if(ds>0)b.v=Math.min(b.v,a.v+4);else a.v=Math.min(a.v,b.v+4);
    }
  }
  for(const f of fx){
    f.life-=dt;
    if(f.life<=0&&f.type==='ball'){f.target.stun=2.05;f.target.v*=.56;audio.effect('hit');}
  }
  fx=fx.filter(f=>f.life>0);
}

function gradient(p,x0,y0,x1,y1,colors){const g=p.createLinearGradient(x0,y0,x1,y1);colors.forEach(([t,c])=>g.addColorStop(t,c));return g;}
function block(p,x,y,w,h,c){p.fillStyle=c;p.fillRect(Math.floor(x),Math.floor(y),Math.ceil(w),Math.ceil(h));}
function polygon(p,pts,color){
  p.beginPath();p.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)p.lineTo(pts[i][0],pts[i][1]);p.closePath();p.fillStyle=color;p.fill();
}
const sky=document.createElement('canvas');sky.width=W;sky.height=H;
function makeSky(){
  const p=sky.getContext('2d');
  p.fillStyle=gradient(p,0,0,0,181,[[0,'#111c47'],[.48,'#36477e'],[.81,'#7b84bd'],[1,'#c7aed4']]);p.fillRect(0,0,W,H);
  const glow=p.createRadialGradient(567,118,13,567,118,296);glow.addColorStop(0,'#f1b4d042');glow.addColorStop(1,'#d5adf300');p.fillStyle=glow;p.fillRect(0,0,W,178);
  for(let j=0;j<7;j++){
    p.beginPath();p.moveTo(-30,80+j*5);p.bezierCurveTo(183,133+j*5,289,-56+j*5,556,43+j*4);
    p.strokeStyle=['#90ffe309','#99ffe412','#8ae0ff12','#b7ffec1b','#68dcea15','#9aebff12','#9aebff08'][j];p.lineWidth=4;p.stroke();
  }
  for(let i=0;i<133;i++){
    const x=hash(i+1500)*W,y=8+hash(i+1800)*134,l=hash(i+2000);
    block(p,x,y,l>.91?2:1,l>.95?2:1,l>.77?'#e3eeffbf':'#c4d6ff64');
    if(l>.976){block(p,x-3,y,7,1,'#def5ffa0');block(p,x,y-3,1,7,'#def5ffa0');}
  }
  const moon=p.createRadialGradient(618,65,8,618,65,58);moon.addColorStop(0,'#d8dcff65');moon.addColorStop(1,'#b6d8ff00');
  p.fillStyle=moon;p.fillRect(560,7,116,116);
  for(let y=-17;y<=17;y++){
    const edge=Math.floor(Math.sqrt(17*17-y*y));
    block(p,618-edge,65+y,edge*2+1,1,y<-4?'#fff1dd':y<9?'#fce6d5':'#e6cbe7');
  }
  for(const [x,y,w,h] of [[609,62,7,2],[617,68,6,3],[625,59,4,2],[609,72,4,2]])block(p,x,y,w,h,'#e6cbdf');
  const peaks=[[-40,146],[15,105],[56,127],[96,82],[131,108],[167,69],[224,117],[257,96],[310,134],[347,109],[394,131],[447,83],[475,99],[524,58],[558,100],[591,91],[628,117],[675,87],[707,108],[747,73],[793,137]];
  polygon(p,[...peaks,[793,177],[-40,177]],'#63769e');
  for(let i=1;i<peaks.length-1;i++){
    const [x,y]=peaks[i],prev=peaks[i-1],next=peaks[i+1];
    if(y>=prev[1]||y>=next[1])continue;
    const lx=lerp(x,prev[0],.42),rx=lerp(x,next[0],.49),ly=lerp(y,prev[1],.42),ry=lerp(y,next[1],.49);
    polygon(p,[[prev[0],prev[1]],[x,y],[x+13,169],[x-31,169]],'#536992');
    polygon(p,[[x,y],[rx,ry],[x+(rx-x)*.68,ry-4],[x+4,ry+3],[x-2,ly-3],[lx,ly]],'#b4c9e4');
    polygon(p,[[x,y],[x+1,ly-3],[x-3,ly+2],[lx,ly]],'#d0d9f1');
  }
  const front=[[-25,140],[28,122],[77,146],[137,123],[196,142],[239,116],[290,143],[355,132],[395,148],[423,131],[484,145],[551,110],[603,137],[638,123],[691,148],[724,129],[800,138]];
  polygon(p,[...front,[800,177],[-25,177]],'#455d89');
  polygon(p,[[-9,151],[48,144],[92,151],[147,142],[189,151],[243,143],[302,152],[370,149],[435,152],[489,144],[576,153],[635,145],[700,151],[785,141],[785,178],[-9,178]],'#627da5');
  for(let i=0;i<185;i++){
    const x=i*4.4+hash(i+12)*4,y=142+hash(i+271)*19, h=5+hash(i+65)*14;
    polygon(p,[[x,y-h],[x-h*.32,y],[x+h*.32,y]],i%3===0?'#2f4d72':'#3e5b84');
  }
  p.fillStyle=gradient(p,0,155,0,H,[[0,'#8ea8c7'],[.13,'#accee3'],[.45,'#a2c5db'],[1,'#b7d7e9']]);p.fillRect(0,158,W,H-157);
  for(let i=0;i<68;i++){
    const y=161+hash(i+1001)**2*269,x=hash(i+333)*W;
    block(p,x,y,5+(y-155)*hash(i+912)*.54,1+(y-155)*.006,i%3?'#d2ecf240':'#5d8cad30');
  }
}
makeSky();

function project(x,z,height=0){
  const dx=x-camera.x,dz=z-camera.z,depth=dx*camera.dx+dz*camera.dz;
  if(depth<NEAR)return null;
  const scale=FOCAL/depth;
  return {x:W/2+(dx*camera.nx+dz*camera.nz)*scale,y:HORIZON+(17.6-height)*scale,depth,scale};
}
function view(s,x,h=0){const p=pick(s,x);return project(p.x,p.z,h);}
function quad(a,b,l,r,c){
  const v=[view(a,l),view(a,r),view(b,r),view(b,l)];
  if(v.every(Boolean))polygon(ctx,v.map(p=>[p.x,p.y]),c);
}
function road(a,b,i){
  const t=mod(Math.floor(mod(a,total)/6),2);
  quad(a,b,-35,35,t?'#b2d3e5':'#b9daeb');
  quad(a,b,-HALFW-1.7,HALFW+1.7,t?'#538db6':'#76b2d4');
  quad(a,b,-HALFW,HALFW,t?'#79accb':'#85b7d5');
  quad(a,b,-19,19,t?'#89bbd8':'#90bfdc');
  quad(a,b,-6,5,t?'#96c6df':'#9fcee3');
  for(const side of checker){
    const l=side*HALFW,r=side*(HALFW-2.6);
    quad(a,b,Math.min(l,r),Math.max(l,r),t?'#e7f2fc':'#f18892');
  }
  if(i%3===0){
    const k=hash(Math.floor(a/4)*9),x=-15+k*30;
    quad(a,b,x,x+.36,k>.5?'#d7f4f445':'#5296c851');
    if(k>.62)quad(a,a+(b-a)*.27,x-3,x+6,'#d9f1f73c');
  }
}
function roadMark(s,start,end,cols,color){
  for(let j=0;j<cols;j++){
    const l=lerp(start,end,j/cols),r=lerp(start,end,(j+1)/cols);
    quad(s,s+1.45,l,r,color[j%2]);quad(s+1.45,s+2.9,l,r,color[(j+1)%2]);
  }
}
function transform(p,x,y,k,fn){
  p.save();p.translate(Math.round(x),Math.round(y));p.scale(k,k);fn();p.restore();
}
function tree(p,seed,decor){
  const b=(x,y,w,h,c)=>block(p,x,y,w,h,c), P=(pts,c)=>polygon(p,pts,c);
  b(-13,-1,27,3,'#627a9b6b');b(-2,-11,5,11,'#634a65');b(-1,-9,2,6,'#a77a7f');
  for(const [y,w] of [[-19,15],[-29,12],[-38,8],[-44,5]]){
    P([[0,y-12],[-w,y+11],[w,y+11],[w-2,y+7]],decor?'#225c66':'#2e5772');
    P([[0,y-12],[-w,y+11],[-2,y+8],[w-2,y+10],[7,y+5],[3,y-2]],decor?'#418278':'#507b93');
    P([[0,y-12],[-w+2,y+7],[-w+7,y+7],[-3,y+4],[2,y+6],[5,y+2],[w-3,y+5]],decor?'#cde9ed':'#bad8e6');
    b(-w+4,y+9,4,2,'#84bacf');
  }
  if(decor){
    b(-1,-62,3,10,'#ffdc8b');b(-4,-59,9,3,'#ffdc8b');b(-1,-59,3,3,'#fff5bf');
    for(let i=0;i<14;i++){
      const y=-10-hash(seed+i+399)*38,spread=(y+58)*.25;
      const x=(hash(seed+i+924)*2-1)*spread;
      b(x,y,2,2,['#ff9aaa','#f4db85','#8feede','#b8c8ff'][i%4]);
    }
    for(let i=0;i<6;i++){
      const y=-12-i*6,x=(i%2?-1:1)*(3+hash(seed+i+700)*5);
      b(x,y,2,2,'#fff1b0');
    }
  }
}
function cabin(p,seed){
  const b=(x,y,w,h,c)=>block(p,x,y,w,h,c);
  b(-21,-1,43,4,'#627a9b56');b(-18,-23,36,23,'#7e536e');b(-15,-21,33,19,'#935e71');
  for(let y=-18;y<-1;y+=4)b(-15,y,30,1,'#603c64');
  b(9,-39,5,12,'#955873');b(8,-41,7,3,'#d6e5ed');
  polygon(p,[[-23,-22],[-1,-44],[21,-22],[18,-19],[-21,-19]],'#494066');
  polygon(p,[[-23,-24],[-1,-45],[21,-24],[17,-23],[11,-28],[6,-29],[-2,-38],[-12,-29],[-14,-25]],'#e0edf5');
  b(-4,-13,9,13,'#503755');b(-2,-10,5,10,'#a47572');b(2,-5,1,1,'#ffdf9d');
  for(const x of [-14,9]){b(x,-16,7,9,'#4c4161');b(x+1,-15,5,6,'#ffc477');b(x+3,-15,1,6,'#d67b72');b(x+1,-12,5,1,'#d67b72');}
  b(-3,-31,5,5,'#ffda96');
  for(let i=0;i<8;i++)b(-18+i*5,-20+(i%2),2,2,['#fb9fad','#d1f0ff','#ffdf87','#a9f7d4'][(i+seed)%4]);
  b(-17,-1,36,2,'#d2e7ef');
}
function candy(p){
  const b=(x,y,w,h,c)=>block(p,x,y,w,h,c);
  b(-7,-1,13,3,'#7896b286');b(-2,-29,5,29,'#e4eef6');b(-1,-33,10,5,'#f0f1f8');b(6,-31,5,10,'#f4edf4');
  for(let i=0;i<5;i++){b(-2,-4-i*5,3,2,'#e46f88');b(1,-5-i*5,2,2,'#ca5e79');}
  b(1,-33,3,5,'#e46f88');b(7,-30,4,3,'#e46f88');b(6,-23,5,2,'#d15b80');
}
function present(p,seed){
  const b=(x,y,w,h,c)=>block(p,x,y,w,h,c),pal=[['#ec788e','#ffc988'],['#44ad9b','#fff1a2'],['#857ed4','#ffadb9']][seed%3];
  b(-10,0,20,2,'#7496b47f');b(-7,-11,14,11,pal[0]);b(-8,-12,16,3,pal[0]);b(-2,-12,4,12,pal[1]);b(-5,-15,4,2,pal[1]);b(1,-15,4,2,pal[1]);b(-6,-5,12,1,'#fff6e56e');
}
function snowman(p){
  const b=(x,y,w,h,c)=>block(p,x,y,w,h,c);
  b(-14,-1,27,3,'#7896b286');b(-8,-14,16,14,'#d4f0f3');b(-10,-11,20,8,'#d4f0f3');b(-7,-23,14,9,'#ecf6f5');b(-8,-21,16,5,'#ecf6f5');
  b(-8,-24,16,3,'#2b4b70');b(-5,-31,10,8,'#314769');b(-5,-26,10,2,'#ec7f98');b(-3,-20,2,2,'#344866');b(3,-20,2,2,'#344866');b(0,-17,6,2,'#ffa575');
  b(-7,-14,14,3,'#e7667d');b(4,-13,3,6,'#e7667d');b(0,-8,2,2,'#56718c');b(0,-4,2,2,'#56718c');
}
function itemBox(p,seed){
  const y=-7+Math.round(Math.sin(clock*4+seed)*2);
  block(p,-9,-1,18,2,'#5183a773');
  polygon(p,[[-11,y-11],[0,y-17],[11,y-11],[11,y+1],[0,y+6],[-11,y+1]],'#71e5e3');
  polygon(p,[[0,y-17],[11,y-11],[0,y-5],[-11,y-11]],'#def9fd');
  polygon(p,[[0,y-5],[11,y-11],[11,y+1],[0,y+6]],'#4e9ac9');
  block(p,-8,y-10,3,3,'#e6fffc');block(p,-6,y-8,3,2,'#e6fffc');block(p,-4,y-6,2,4,'#e6fffc');block(p,-4,y,2,2,'#e6fffc');
  block(p,5,y-7,2,5,'#baf1ff');
}
function gatePole(p){
  block(p,-3,-40,6,40,'#f3e9f5');for(let i=0;i<8;i++)block(p,-3,-2-i*5,6,2,'#e68193');
  block(p,-4,-43,8,5,'#fbd285');block(p,-1,-44,2,3,'#fff5c4');
}
function gate(s){
  const a=view(s,-25,34),b=view(s,25,34);
  if(!a||!b||Math.abs(a.x-b.x)<19)return;
  const h=Math.min(31,Math.max(3,(b.x-a.x)*.12));
  if(h<0||b.x<a.x)return;
  polygon(ctx,[[a.x,a.y],[b.x,b.y],[b.x,b.y+h],[a.x,a.y+h]],'#193455');
  polygon(ctx,[[a.x,a.y],[b.x,b.y],[b.x,b.y+2],[a.x,a.y+2]],'#bceaf2');
  if(h>12){
    ctx.save();ctx.translate((a.x+b.x)/2,(a.y+b.y)/2+h*.68);
    ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));ctx.textAlign='center';ctx.font='900 '+Math.floor(h*.54)+'px monospace';ctx.fillStyle='#d2f7ff';ctx.fillText('✦ FROST CUP ✦',0,0);ctx.restore();
  }
}
function kart(p,k,isSelf){
  const d=drivers[k.id],b=(x,y,w,h,c)=>block(p,x,y,w,h,c);
  const tilt=clamp(k.lat*.12,-5,5);p.translate(tilt,0);
  if(k.boost>.01&&mode==='racing'){
    const jet=7+hash(Math.floor(clock*34)+k.id)*8;
    for(const x of [-9,8]){b(x,-4,4,jet,'#47b8ed');b(x+1,-4,2,jet*.74,'#d3ffff');}
  }
  b(-18,-1,36,4,'#1a335773');b(-14,-3,28,2,'#1a33578a');
  b(-18,-14,8,14,'#24243c');b(10,-14,8,14,'#24243c');b(-17,-12,3,10,'#4c5878');b(14,-12,3,10,'#4c5878');
  b(-14,-18,28,12,d.dark);b(-11,-20,22,13,'#3b374c');b(-9,-19,18,12,'#6a5370');
  p.imageSmoothingEnabled=false;p.drawImage(d.back,-14+tilt*.45,-39,28,28);
  b(-15,-15,30,9,d.color);b(-12,-16,24,3,d.light);b(-10,-7,20,4,d.dark);
  b(-12,-13,6,3,'#fff1aa');b(6,-13,6,3,'#fff1aa');b(-11,-12,4,1,'#ff7e8b');b(7,-12,4,1,'#ff7e8b');
  b(-5,-11,10,5,'#263a58');b(-4,-10,8,3,'#bceaff');
  b(-13,-6,26,2,'#a6c7e2');b(-17,-6,5,3,'#7388ac');b(12,-6,5,3,'#7388ac');
  if(isSelf&&k.slip&&k.drift>.37){
    const c=k.drift>1.05?'#ffca77':'#beefff';
    for(let j=0;j<8;j++){const k=hash(j+Math.floor(clock*20));b((j%2===0?-1:1)*(13+k*7),-2+k*7,1+k,1,c);}
  }
  if(k.stun){
    b(-5,-43,3,3,'#ffcd7d');b(0,-48,2,2,'#f4f8c1');b(5,-44,3,2,'#ffcd7d');
  }
}
function draw(){
  ctx.drawImage(sky,0,0);
  const base=player.s-23.5, direction=position(base+12);
  const n=pick(base,player.x*.73);
  camera={...direction,...n};
  const near=base+NEAR+3,far=player.s+231,step=3.8;
  // Keep the verge near the camera visible when the road bends.
  for(let b=far,i=0;b>=near;b-=step,i++)road(Math.max(near,b-step),b,i);
  const check=total*Math.ceil(near/total);
  if(check<far-4)roadMark(check,-HALFW+1,HALFW-1,14,['#e8f5fc','#385a87']);
  const batch=[];
  function add(s,x,kind,data={}){
    if(s<near-2||s>far+20)return;
    const p=view(s,x);
    if(p&&p.x>=-500&&p.x<=W+500)batch.push({...p,kind,data:{...data,s,x}});
  }
  function ahead(s){return s+Math.ceil((near-2-s)/total)*total;}
  for(const e of elements)add(ahead(e.s),e.x,e.type,e);
  for(const s of itemStations){
    const at=ahead(s);
    for(const x of [-14,0,14])add(at,x,'item',{seed:x/14});
  }
  for(const node of boostStations){
    const s=ahead(node.s),x=node.x;
    if(s>=near&&s<far-6){
      quad(s-2,s+3,x-7,x+7,'#4375a9');quad(s-1,s+2,x-6,x+6,'#8ceaf1');
      for(const t of [-3,1,5]){
        const corners=[view(s-.9,x+t-1),view(s+.4,x+t),view(s-.9,x+t+1),view(s-.35,x+t+1),view(s+1,x+t),view(s-.35,x+t-1)];
        if(corners.every(Boolean))polygon(ctx,corners.map(c=>[c.x,c.y]),'#ffffff');
      }
    }
  }
  if(check<far+15){add(check,-25,'pole');add(check,25,'pole');add(check,0,'gate');}
  for(const k of karts){
    if(k===player||!k.done){
      const ds=k.s-player.s;
      if(ds>-25&&ds<240)add(k.s,k.x,'kart',{k});
    }
  }
  for(const f of fx){
    const t=clamp(1-f.life/f.total,0,1),s=lerp(f.s,f.target.s,t),x=lerp(f.x,f.target.x,t);
    const p=view(s,x,3+Math.sin(t*Math.PI)*7);
    if(p)batch.push({...p,kind:'ball',data:{}});
  }
  batch.sort((a,b)=>b.depth-a.depth);
  for(const p of batch){
    const d=p.data;
    if(p.kind==='gate'){gate(d.s);continue;}
    const k=p.scale;
    if(p.kind==='kart'){
      const q=d.k,scale=k*.265;
      transform(ctx,p.x,p.y,scale,()=>kart(ctx,q,q===player));
      if(q===player){
        polygon(ctx,[[p.x-5,p.y-43*scale],[p.x+5,p.y-43*scale],[p.x,p.y-43*scale+6]],'#c9f9ff');
      }
    }else if(p.kind==='tree'||p.kind==='pine'){
      transform(ctx,p.x,p.y,k*(.34+hash(d.seed+471)*.19),()=>tree(ctx,d.seed,p.kind==='tree'));
    }else if(p.kind==='cane')transform(ctx,p.x,p.y,k*.27,()=>candy(ctx));
    else if(p.kind==='gift')transform(ctx,p.x,p.y,k*.24,()=>present(ctx,d.seed));
    else if(p.kind==='snowman')transform(ctx,p.x,p.y,k*.43,()=>snowman(ctx));
    else if(p.kind==='cabin')transform(ctx,p.x,p.y,k*.75,()=>cabin(ctx,d.seed));
    else if(p.kind==='item')transform(ctx,p.x,p.y,k*.24,()=>itemBox(ctx,d.seed));
    else if(p.kind==='pole')transform(ctx,p.x,p.y,k*.85,()=>gatePole(ctx));
    else if(p.kind==='ball')transform(ctx,p.x,p.y,k*.4,()=>{block(ctx,-3,-3,6,6,'#effbff');block(ctx,-4,-2,8,3,'#effbff');block(ctx,-1,-2,3,2,'#aef5ff');});
  }
  const snow=reduceMotion?23:87;
  for(let i=0;i<snow;i++){
    const size=hash(i+351)*2.35+.78;
    const drift=reduceMotion?0:clock*(7+size*12);
    const x=mod(hash(i+60)*W+drift*.53+Math.sin(i+clock)*6,W),y=mod(hash(i+183)*H+drift,H);
    block(ctx,x,y,size,size,i%4===0?'#e7f8ff90':'#e7f8ffd0');
    if(size>2.7)block(ctx,x+1,y-1,1,size+2,'#e7f8ff8f');
  }
}

const svgNS='http://www.w3.org/2000/svg';
function svgNode(tag,attrs){
  const node=document.createElementNS(svgNS,tag);Object.entries(attrs).forEach(([k,v])=>node.setAttribute(k,v));return node;
}
function mapPos(s){
  const a=position(s);return [32+(a.x+5)*.463,116-(a.z+215)*.151];
}
function initMap(){
  const path=Array.from({length:135},(_,i)=>mapPos(i*total/135).join(',')).join(' L');
  for(const [color,w] of [['#0b162b',17],['#3b607d',12],['#6fadc9',8],['#a5d3e3',1]]){
    el.map.append(svgNode('path',{d:'M'+path+'Z',fill:'none',stroke:color,'stroke-width':w, ...(w===1?{'stroke-dasharray':'2 4'}:{})}));
  }
  const [x,y]=mapPos(0);
  el.map.append(svgNode('path',{d:'M'+(x-5)+' '+y+'h10',stroke:'#f4f4ff','stroke-width':2}));
  slots=drivers.map(d=>{const n=svgNode('circle',{r:3.7,fill:d.color,stroke:'#122239','stroke-width':1.25});el.map.append(n);return n;});
}
function portraitImg(d){
  const img=document.createElement('img');img.className='portrait';img.src=d.profile;img.alt='';img.draggable=false;return img;
}
const options=drivers.map((d,i)=>{
  const button=document.createElement('button');button.type='button';button.className='driver';button.style.setProperty('--driver-color',d.color);
  button.append(portraitImg(d));const name=document.createElement('span');name.textContent=d.name;button.append(name);
  const details=['균형 잡힌 성능','민첩한 조향','빠른 가속','가속과 조향에 강함','균형 잡힌 고속 주행','최고 속도에 강함'][i];
  button.title=d.name+' · '+details;
  button.addEventListener('click',()=>{if(mode!=='ready')return;selected=i;write('driver',i);audio.unlock();audio.effect('select');reset();});
  el.drivers.append(button);return button;
});

const rows=drivers.map((d,i)=>{
  const li=document.createElement('li');li.className='rank';li.style.setProperty('--driver-color',d.color);
  const num=document.createElement('span');num.className='rank-num';
  const name=document.createElement('span');name.className='rank-name';name.textContent=d.name;
  const end=document.createElement('span');end.className='rank-end';
  li.append(num,portraitImg(d),name,end);
  return {li,num,end};
});
let lastRank='';
function refresh(full){
  const playing=mode==='countdown'||mode==='racing', showMenu=!playing, paused=mode==='paused';
  if(full){
    el.menu.hidden=!showMenu;
    el.pause.hidden=!playing;
    el['drive-hud'].hidden=mode!=='racing';
    el.touch.hidden=mode!=='racing';
    el.stage.classList.toggle('racing',mode==='racing');
    options.forEach((b,i)=>{b.setAttribute('aria-pressed',String(i===selected));b.disabled=mode!=='ready';});
    if(showMenu){
      if(mode==='finished'){
        el['menu-title'].innerHTML=finishPlace===1?'VICTORY<em>!</em>':finishPlace+'<em>위</em> 완주';
        el['menu-caption'].textContent=(newBest?'신기록 · ':'완주 기록 · ')+better(raceTime)+(best&&!newBest?'  /  최고 '+better(best):'');
      }else{
        el['menu-title'].innerHTML=paused?'PAUSED':'FROST <em>CUP</em>';
        el['menu-caption'].textContent=paused?'레이스가 일시 정지되었어요.':'눈 내리는 서킷에서 펼쳐지는 6인 레이스';
      }
      el.start.querySelector('span').textContent=paused?'이어 달리기':mode==='finished'?'다시 도전':'레이스 시작';
    }
    el['rank-state'].textContent=mode==='racing'?'진행 중':mode==='finished'?'완주':mode==='paused'?'일시 정지':mode==='countdown'?'출발 준비':'대기 중';
    el['rank-state'].parentElement.classList.toggle('active',playing);
  }
  const sequence=mode==='ready'?[...karts]:orderKarts();
  const key=sequence.map(k=>k.id).join('')+selected;
  if(key!==lastRank){
    sequence.forEach((k,i)=>{
      const row=rows[k.id];row.num.textContent=pad(i+1);row.li.classList.toggle('self',k===player);
      row.end.textContent=k===player?'YOU':'';row.end.classList.toggle('you',k===player);el.rankings.append(row.li);
    });
    lastRank=key;
  }
  const countText=mode==='countdown'?Math.max(1,Math.ceil(count)):mode==='racing'&&goFlash>0?'GO!':'';
  el.countdown.hidden=!countText;el.countdown.textContent=countText;
  el.lap.textContent=pad(player.lap);
  el.speed.textContent=Math.round(player.v*1.58);
  el.item.textContent=player.item==='boost'?'부스트':player.item==='snowball'?'눈덩이':'—';
  el.timer.textContent=better(raceTime);
  for(const k of karts){
    const n=slots[k.id], [x,y]=mapPos(k.s);
    n.setAttribute('cx',x);n.setAttribute('cy',y);n.setAttribute('r',k===player?5.3:3.7);
    n.setAttribute('stroke',k===player?'#f1fcff':'#122239');
    if(k===player&&n!==el.map.lastElementChild)el.map.append(n);
  }
}
function soundUI(){
  el.sound.setAttribute('aria-pressed',String(!audio.muted));el.sound.setAttribute('aria-label',audio.muted?'소리 켜기':'소리 끄기');
  el.sound.querySelector('use').setAttribute('href',audio.muted?'#i-mute':'#i-sound');
}
el.sound.addEventListener('click',()=>{audio.toggle();soundUI();if(!audio.muted)audio.effect('select');});
el.restart.addEventListener('click',()=>{audio.unlock();audio.effect('select');reset();});
el.start.addEventListener('click',()=>mode==='paused'?pause():start());
el.pause.addEventListener('click',pause);
const handled=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyW','KeyA','KeyS','KeyD','ShiftLeft','ShiftRight','Space','Escape','Enter','KeyM']);
window.addEventListener('keydown',e=>{
  if(!handled.has(e.code)||e.altKey||e.metaKey||e.ctrlKey)return;
  const focused=e.target.closest?.('button,a');
  if((e.code==='Enter'||e.code==='Space')&&focused&&mode!=='racing'&&mode!=='countdown')return;
  if((e.code==='Space'||e.code==='Enter')&&focused&&focused!==el.start&&mode==='racing')return;
  if(e.code.startsWith('Arrow')&&!['racing','countdown','paused'].includes(mode))return;
  if(e.code!=='ShiftLeft'&&e.code!=='ShiftRight')e.preventDefault();
  keys.add(e.code);
  if(e.repeat)return;
  if(e.code==='KeyM'){audio.toggle();soundUI();}
  if(e.code==='Escape')pause();
  if(e.code==='Enter'){
    if(mode==='ready'||mode==='finished')start();
    else if(mode==='paused')pause();
  }
  if(e.code==='Space')useItem();
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>{keys.clear();if(mode==='racing'||mode==='countdown')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='racing'||mode==='countdown'))pause();});
for(const b of el.touch.querySelectorAll('[data-key]')){
  const k=b.dataset.key;
  b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys.add(k);if(k==='Space')useItem();});
  for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(k));
}
initMap();soundUI();reset();
let lastFrame=performance.now();
function frame(now){
  const dt=Math.min(.035,(now-lastFrame)/1000);lastFrame=now;if(mode!=='paused')clock+=dt;
  update(dt);audio.tune(mode==='countdown'||mode==='racing');
  if((uiTick+=dt)>.060){uiTick=0;refresh(false);}
  draw();requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
