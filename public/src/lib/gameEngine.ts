// @ts-nocheck
import { evaluateGuess, numericQuestions } from './numericScoring';
// V8: numeric-answer SSX Exeter edition with reveal-on-landing scoring and branded overlays.
// Detailed Canvas ski-jump scene with three distinct cinematic camera phases.
export function mountGame() {
  const abort = new AbortController();
  const $ = (id) => document.getElementById(id);
  const canvas = $('scene');
  if (!canvas) return () => {};
  const ctx = canvas.getContext('2d', { alpha: false });
  // Individually illustrated original PNG sprite assets. Assets are drawn nearest-neighbour.
  const art = {};
  for (const name of ['skier-idle','skier-ready','skier-downhill','skier-takeoff','skier-flight','skier-landing','pine-0','pine-1','pine-2','lodge','alpine-panorama']) {
    const img = new Image(); img.src = `/art/${name}.png`; art[name] = img;
  }
  const available = (name) => art[name]?.complete && art[name]?.naturalWidth > 0;

  // A real portrait world viewport on phones, not a cropped desktop canvas.
  // World geometry stays unchanged; only the viewport, framing and camera differ.
  let portrait = window.matchMedia('(max-width: 700px)').matches;
  let W = portrait ? 420 : 960;
  let H = portrait ? 600 : 540;
  const SCALE = portrait ? 2 : 3;
  function resizeCanvas() {
    const next = window.matchMedia('(max-width: 700px)').matches;
    if (next === portrait && canvas.width === W * pixelScale) return;
    portrait = next;
    W = portrait ? 420 : 960;
    H = portrait ? 600 : 540;
    const density = portrait ? 2 : 3;
    canvas.width = W * density;
    canvas.height = H * density;
    ctx.imageSmoothingEnabled = false;
    pixelScale = density;
  }
  let pixelScale = SCALE;
  canvas.width = W * pixelScale;
  canvas.height = H * pixelScale;
  ctx.imageSmoothingEnabled = false;
  window.addEventListener('resize', resizeCanvas, { signal: abort.signal });
  const questions = numericQuestions;
  const hash = (x, y = 0) => { let z = Math.sin(x * 127.13 + y * 319.73) * 43758.55; return z - Math.floor(z); };
  const lerp = (a,b,t) => a+(b-a)*t;
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const ease = (t) => t*t*(3-2*t);
  function rect(x,y,w,h,c) {ctx.fillStyle=c;ctx.fillRect(x,y,w,h)}
  function polygon(pts,c) { ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)ctx.lineTo(pts[i][0],pts[i][1]);ctx.closePath();ctx.fill(); }
  function line(x1,y1,x2,y2,c,w=1) {ctx.strokeStyle=c;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
  let scoreFeedback={status:'',description:'',percentile:null},submittedGuesses=[],runDay='',state='intro',round=0,remaining=25,elapsed=0,flightElapsed=0,launchSpeed=0,launchElapsed=0,launchFrom=0,target=0,answer='',scores=[],camera={x:465,y:242,z:1.00},sceneTime=0,frame=0,previous=performance.now(),finished=false;
  const startX=465,endX=1220;
  function inrun(t){const u=clamp(t,0,1); const x=lerp(startX,endX,u);const y=165+270*(u*u*(3-2*u));const tangent=Math.atan((270*6*u*(1-u))/(endX-startX));return {x,y,angle:tangent};}
  // World metres map consistently to 5.4px. Continuous concave landing hill,
  // transitioning into one smooth snowfield (no generated cliff peaks in the course).
  const metresToX=(metres)=>endX+110+metres*5.4;
  function landing(x) {const d=Math.max(0,x-endX);return 507+132*(1-Math.exp(-d/760))+.018*d;}

  const lip=inrun(1);
  function position(){
    if(state==='intro') {const p=inrun(.025);return {...p,y:p.y-11};}
    if(state==='answering'){const u=.025+ease(clamp(elapsed/25,0,1))*.975;const p=inrun(u);return {...p,y:p.y-11};}
    if(state==='launch'){const u=lerp(launchFrom,1,ease(clamp(launchElapsed/.62,0,1)));const p=inrun(u);return {...p,y:p.y-11};}
    if(state==='flight' || state==='intermission' || state==='end'){
      const p=clamp(flightElapsed/4.1,0,1),span=110+target*5.4,x=endX+span*p;
      const ground=landing(x)-19;
      const trajectory=lerp(lip.y-15,ground,p)-Math.sin(Math.PI*p)*(70+target*.48);
      return {x,y:p>=1?ground:trajectory,angle:p>=1?0:lerp(-.23,.17,p),air:p<1};
    }
    return {...inrun(0),air:false};
  }
  function drawSky(t, parallax){
    if (available('alpine-panorama')) {
      const pan = art['alpine-panorama'];
      const width = 1500;
      const offset = ((parallax * .085) % width + width) % width;
      for (let i=-1;i<2;i++) ctx.drawImage(pan, i*width-offset, 0, width, 540);
      return;
    }

    // Hand-crafted high-colour pixel alpine panorama, five distinct parallax planes.
    for(let y=0;y<540;y+=2){let q=y/540;rect(0,y,960,2,`rgb(${Math.round(130+64*q)},${Math.round(184+42*q)},${Math.round(225+23*q)})`)}
    for(let i=0;i<20;i++){
      let x=((i*173+hash(i,5)*117-parallax*.019)%1350+1350)%1350-180;
      let y=35+hash(i,17)*144,w=30+hash(i,8)*48;
      rect(x,y,w,4,'#f7fcff');rect(x+7,y-4,w*.65,4,'#f7fcff');rect(x+4,y+4,w*.75,3,'#d5e9f7');
    }
    for(let layer=0;layer<4;layer++){
      const shift=parallax*(.042+layer*.075), base=278+layer*57;
      const palettes=[['#8fadd8','#b1cbeb','#f7ffff'],['#6f92c7','#91b1da','#eff7ff'],['#547ba4','#7b9fc5','#e7f2ff'],['#396d8c','#608aa5','#dceffa']];
      let colors=palettes[layer];
      for(let i=-3;i<8;i++){
        const bx=i*253-((shift%253)+253)%253-100, peak=72+hash(i,layer+17)*93+layer*45;
        polygon([[bx-55,base+65],[bx+110,peak],[bx+286,base+65]],colors[0]);
        polygon([[bx+110,peak],[bx+286,base+65],[bx+110,base+65]],colors[1]);
        polygon([[bx+110,peak],[bx+45,peak+85],[bx+90,peak+66],[bx+116,peak+40],[bx+140,peak+70],[bx+170,peak+91]],colors[2]);
        polygon([[bx+110,peak],[bx+141,peak+62],[bx+121,peak+51]],'#ffffff');
        for(let j=0;j<20;j++){const xx=bx+30+hash(i*33+j,layer)*160, yy=peak+70+hash(j,i+13)*110;rect(xx,yy,2.3,1.3,colors[1])}
      }
    }
    // Distant dark-green timberline with tapered trees.
    const forestShift=parallax*.15;
    for(let i=-3;i<120;i++){
      let x=i*15-((forestShift%15)+15)%15;let h=14+hash(i,36)*38;
      polygon([[x-9,445],[x,443-h],[x+9,445]],i%3?'#35677d':'#2e5c73');
      polygon([[x-6,438],[x,444-h],[x+6,438]],'#507e91');
    }
  }

  function iceGlitter(x,y,seed){
    const c=['#f9ffff','#addce8','#7ebacc','#ffffff','#d0eff5'];
    for(let j=0;j<9;j++){
      const xx=x+(hash(seed,j)-.5)*43, yy=y+(hash(j,seed)-.5)*18;
      rect(xx,yy,.5+hash(j+2,seed)*1.1,.5,c[j%5]);
    }
  }
  function lodge(x,y,seed){
    if (available('lodge')) {
      ctx.drawImage(art.lodge,Math.floor(x-25),Math.floor(y-107),170,116);
      return;
    }

    // Copper-roof timber chalet, stone plinth, glowing multi-pane windows.
    rect(x-5,y-31,61,36,'#314961');rect(x-1,y-31,53,31,'#9b6747');
    for(let i=0;i<8;i++)rect(x+i*7,y-29,1.5,27,'#734d3b');
    polygon([[x-11,y-32],[x+25,y-54],[x+62,y-32],[x+56,y-26],[x+25,y-46],[x-5,y-25]],'#283f5a');
    polygon([[x-11,y-35],[x+25,y-57],[x+62,y-35],[x+52,y-33],[x+25,y-49],[x-3,y-29]],'#fbffff');
    polygon([[x+25,y-57],[x+62,y-35],[x+52,y-33],[x+25,y-49]],'#c2e6f6');
    for(let j=0;j<3;j++){let xx=x+6+j*17;rect(xx,y-23,11,13,'#263a54');rect(xx+2,y-21,7,9,'#f7cc81');rect(xx+5,y-21,1,9,'#8c563c')}
    rect(x+22,y-12,10,15,'#25394f');rect(x+25,y-10,3,2,'#f6d280');
    rect(x+45,y-60,7,21,'#7d5f55');rect(x+43,y-62,11,4,'#fff');
    rect(x-5,y,61,4,'#506b7b');rect(x+7,y+3,6,3,'#e5f7f9');rect(x+37,y+3,7,3,'#e5f7f9');
    for(let j=0;j<4;j++)rect(x+49+j*3,y-66-j*4+Math.sin(sceneTime+j)*2,4,3,'#eaf8ff');
  }

  function firCluster(x,y,seed){
    const sizes=[.5,.72,.56,.42,.65];
    for(let j=0;j<5;j++)pine(x+(j-2)*17,y+(hash(seed,j)-.5)*15,sizes[j],j);
  }
  function pine(x,y,s,i){
    const key=`pine-${Math.abs(i)%3}`;
    if (available(key)) {
      const h=150*s,w=105*s;
      ctx.drawImage(art[key],Math.round(x-w/2),Math.round(y-h+5*s),Math.round(w),Math.round(h));
      return;
    }

    // Layered fir foliage with hand-drawn powder-snow boughs.
    rect(x-3*s,y-22*s,6*s,28*s,'#795948');rect(x-1.8*s,y-20*s,2*s,24*s,'#b68a62');
    for(let j=0;j<5;j++){
      const w=(20-j*2.7)*s, top=y-(j*9+13)*s;
      polygon([[x-w,top+18*s],[x-6*s,top+3*s],[x,top-8*s],[x+6*s,top+3*s],[x+w,top+18*s],[x+5*s,top+14*s],[x,top+19*s],[x-8*s,top+13*s]],j%2?'#245f68':'#317b79');
      polygon([[x-w*.97,top+13*s],[x-w*.45,top+6*s],[x-2*s,top+9*s],[x+2*s,top+7*s],[x+w*.60,top+13*s],[x+w*.94,top+13*s],[x+w*.5,top+16*s],[x+2*s,top+14*s],[x-5*s,top+17*s]],'#f6ffff');
      line(x-w*.8,top+14*s,x-5*s,top+16*s,'#abcfe3',1.2*s);
    }
    rect(x-2*s,y-61*s,4*s,3*s,'#fff');
  }

  function markerMountain(metres){
    const x=metresToX(metres),y=landing(x),h=112+(metres%100===0?35:0);
    // Fixed sculpted peaks behind the course; these are intentional mileposts,
    // not repeated random terrain that could be mistaken for ground collision.
    polygon([[x-90,y+9],[x,y-h],[x+103,y+9]],'#597fa7');
    polygon([[x,y-h],[x+103,y+9],[x+15,y+9]],'#809fc6');
    polygon([[x,y-h],[x-34,y-h*.52],[x-15,y-h*.64],[x,y-h*.53],[x+17,y-h*.65],[x+35,y-h*.47]],'#f7ffff');
    polygon([[x,y-h],[x+35,y-h*.47],[x+7,y-h*.63]],'#bddcf2');
    // Large, always-labelled distance marker, attached to this exact world metre.
    line(x,y-8,x,y-53,'#263d5d',3);
    rect(x-36,y-77,72,24,'#243e62');rect(x-33,y-74,66,18,'#fff6e7');
    ctx.font='bold 12px monospace';ctx.textAlign='center';ctx.fillStyle='#28405e';ctx.fillText(`${metres} m`,x,y-61);
    polygon([[x-3,y-54],[x+3,y-54],[x,y-48]],'#de635e');
  }
  function terrain(){
    // One uninterrupted snowy surface with subdued rock strata only underneath.
    const top=[];for(let x=-500;x<=5200;x+=12){top.push([x,x<endX?556:landing(x)]);}
    polygon([...top,[5200,1400],[-500,1400]],'#5d7899');
    polygon([...top,...top.slice().reverse().map(([x,y])=>[x,y+48])],'#aec9df');
    polygon([...top,...top.slice().reverse().map(([x,y])=>[x,y+22])],'#e8f5ff');
    polygon([...top,...top.slice().reverse().map(([x,y])=>[x,y+9])],'#ffffff');
    for(let i=0;i<550;i++){
      const x=-450+i*10+hash(i,71)*5,y=(x<endX?556:landing(x))+12+hash(i,20)*27;
      rect(x,y,1+hash(i,31)*2,1,i%4===0?'#8ba9c7':'#c8dbea');
    }
    // Markers are real points on the flight-distance scale.
    for(const m of [50,100,150,200,250])markerMountain(m);
    // Course boundary and landing stripes sit on the same ground function.
    for(let m=0;m<=260;m+=10){
      const x=metresToX(m),y=landing(x),major=m%50===0;
      line(x,y-3,x,y-(major?19:10),major?'#c65058':'#6887a4',major?3:2);
      if(!major&&m%20===0){ctx.textAlign='center';ctx.font='bold 9px monospace';ctx.fillStyle='#37516e';ctx.fillText(`${m}`,x,y-17);}
    }
  }

  function ramp(){
    // Metal ski tower rendered as stacked pixel-art trusses with snowy guard rails.
    const surface=[];for(let i=0;i<=250;i++){let p=inrun(i/250);surface.push([p.x,p.y])}
    polygon([...surface,...surface.slice().reverse().map(([x,y])=>[x,y+25])],'#273c5a');
    polygon([...surface,...surface.slice().reverse().map(([x,y])=>[x,y+12])],'#7ba9c5');
    polygon([...surface,...surface.slice().reverse().map(([x,y])=>[x,y+6])],'#f6fdff');
    for(let i=0;i<surface.length;i+=2){const [x,y]=surface[i];rect(x,y+3,3,1.2,i%4?'#c8e8f4':'#fff');rect(x,y+14,2,3,'#416f97')}
    for(let i=12;i<242;i+=13){const [x,y]=surface[i];line(x,y+25,x,y+320,'#334861',3);rect(x-2,y+26,6,6,'#557a98');}
    for(let i=15;i<242;i+=13){const [x,y]=surface[i];line(x,y+52,x+45,y+95,'#506b88',2);line(x+45,y+55,x,y+95,'#506b88',2);line(x,y+110,x+45,y+155,'#334d6a',2)}
    // Grand start tower with a red lodge roof and glowing windows.
    rect(435,123,101,58,'#253a57');rect(442,129,87,47,'#98a9bc');
    for(let j=0;j<3;j++)for(let k=0;k<4;k++){
      const xx=448+k*19,yy=134+j*12;
      rect(xx,yy,13,9,'#2b4c67');rect(xx+2,yy+2,9,5,'#f7c78e');rect(xx+6,yy+2,1,5,'#536e87');
    }
    polygon([[427,124],[480,105],[541,125],[533,131],[478,113],[434,133]],'#253650');
    polygon([[427,124],[480,105],[541,125],[529,123],[480,111],[438,129]],'#f5ffff');
    polygon([[480,105],[541,125],[529,123],[480,111]],'#b7d9ea');
    rect(442,175,94,7,'#476987');rect(456,181,6,165,'#344762');rect(522,181,6,165,'#344762');
    for(let i=0;i<12;i++)rect(458,189+i*11,68,2,'#6788a2');
    rect(537,93,3,57,'#4a5364');polygon([[540,96],[558,100],[540,110]],'#e85d60');
    for(let i=0;i<14;i++){
      const p=inrun((i+1)/16);rect(p.x,p.y-10,2,10,'#456681');
      polygon([[p.x,p.y-16],[p.x+11,p.y-14],[p.x,p.y-10]],i%2?'#e96663':'#f2c14d');
    }
    polygon([[endX-6,432],[endX+22,423],[endX+44,429],[endX+31,439],[endX,447]],'#f8ffff');
    line(endX-8,445,endX+29,437,'#568eac',2);
  }

  function spectators(){
    // Crowd and cabins only in a distant spectator zone; never on the landing hill.
    for(let i=0;i<75;i++){
      const x=1420+i*39,y=landing(x)+80+(i%3)*5;
      rect(x,y,3,7,['#d85c61','#f2d68c','#70acb9','#425578'][i%4]);
      rect(x,y-3,3,3,'#f0c4a1');
    }
    for(let i=0;i<7;i++){
      const x=1510+i*470,y=landing(x)+210;
      lodge(x,y,i);
      firCluster(x+175,y+10,i);
    }
  }

  function skier(x,y,angle,air,t){
    const pose = state==='intro' ? 'idle' : state==='answering' ? (elapsed < .7 ? 'ready' : 'downhill') : state==='launch' ? 'takeoff' : state==='flight' ? 'flight' : 'landing';
    const key='skier-'+pose;
    if(available(key)) {
      ctx.save();ctx.translate(Math.round(x),Math.round(y));
      // Anatomically consistent joints are pre-posed; do not rotate sprite
      // independently from skis (which used to twist the head and legs apart).
      ctx.drawImage(art[key],-75,-110,150,140);
      ctx.restore();return;
    }

    // Original hand-drawn 2D character, 1px detailing on a 960x540 virtual canvas.
    ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(1.20,1.20);
    if(air){for(let i=0;i<8;i++)rect(-41-i*11,-2+(i%3)*2,8-i*.5,1,'#d4eff8')}
    // Offset double skis with yellow-and-blue tips.
    polygon([[-39,9],[29,8],[35,4],[35,8],[30,12],[-39,12]],'#172d49');
    polygon([[-38,9],[28,9],[32,6],[32,9],[-38,10]],'#55a8d8');
    line(-36,12,23,12,'#f7d178',2);
    // Boots and angled stance.
    polygon([[-12,-5],[0,-9],[10,3],[3,7],[-7,3]],'#233951');
    polygon([[0,-10],[12,-11],[18,2],[12,6],[2,-2]],'#33496e');
    rect(-7,4,12,4,'#fcfaff');rect(10,3,11,4,'#f9fcff');rect(15,5,7,2,'#ffbf58');
    // Ski suit: segmented crimson jacket, vivid pale trim and navy shadows.
    polygon([[-15,-34],[0,-36],[10,-28],[16,-12],[7,-7],[-8,-14],[-19,-23]],'#213a59');
    polygon([[-13,-34],[0,-33],[9,-24],[8,-15],[-9,-18],[-17,-25]],'#dd5358');
    polygon([[-11,-34],[-4,-34],[3,-20],[-4,-18]],'#fbfcff');
    polygon([[3,-32],[8,-28],[15,-17],[10,-14],[5,-19]],'#f47a71');
    rect(-16,-22,4,7,'#f7ffff');rect(4,-21,3,8,'#f8ffff');rect(-14,-13,8,3,'#7ca9cf');
    // One hand and reaching arm.
    polygon([[9,-17],[20,-13],[25,-7],[20,-5],[15,-10],[7,-12]],'#f2f6f9');
    rect(20,-8,7,4,'#283954');rect(23,-7,2,1,'#9fb4d0');
    // Helmet / face / mirrored goggles are sprite-native and separately outlined.
    polygon([[-9,-49],[1,-52],[11,-45],[12,-35],[6,-28],[-7,-30],[-13,-37]],'#1d314d');
    polygon([[-8,-48],[2,-49],[10,-43],[9,-37],[-10,-37]],'#dc515b');
    polygon([[-8,-47],[-2,-50],[3,-49],[7,-44],[3,-42],[-5,-43]],'#fffafa');
    rect(0,-39,12,5,'#142d4b');rect(1,-38,10,3,'#49c0f0');rect(3,-38,4,1,'#f6ffff');
    rect(-6,-37,9,8,'#efc09b');rect(-4,-32,4,2,'#cf967d');rect(-11,-38,3,7,'#ac384a');
    rect(-6,-49,2,2,'#fff');rect(1,-45,3,2,'#ffd7d2');
    if(!air && state==='flight'){for(let i=0;i<8;i++)rect(-13-i*7,7+hash(i,8)*9,3,2,'#f7ffff')}
    ctx.restore();
  }

  function drawAustenTag(x,y){
    const bx=x-168, by=y-112;
    rect(bx,by,104,22,'#243e62');
    rect(bx+3,by+3,98,16,'#fff5df');
    ctx.textAlign='left';
    ctx.font='bold 10px monospace';
    ctx.fillStyle='#243e62';
    ctx.fillText('UNCLE AUSTEN',bx+8,by+14);
    line(bx+103,by+11,x-30,y-42,'#243e62',2);
    polygon([[x-30,y-42],[x-38,y-43],[x-31,y-36]],'#c85158');
  }

  function snow(t,wind){for(let i=0;i<210;i++){let dx=wind? (t*(85+hash(i,3)*150)):t*(12+hash(i,3)*25),x=(hash(i,24)*1120+dx)%1120-80,y=(hash(i,35)*650+t*(25+hash(i,54)*35))%650-50;const size=hash(i,48)>.82?1.8:.7;if(wind){line(x,y,x-13-size*8,y+3,'#caeaf5',size)}else rect(x,y,size,size,'#e6f6fa') }}
  // Camera targets are defined in SCREEN SPACE, not arbitrary world offsets.
  // Hard screen-space constraints guarantee that the player never leaves frame,
  // even during the high-speed transition from close-up to wide flight coverage.
  function updateCamera(dt,p){
    // Portrait: exact centre lock, on EVERY frame, including camera zoom transitions.
    // The skier image is drawn relative to the ski contact point; offset the camera
    // vertically to centre the skier's actual body rather than his boot tips.
    if (portrait) {
      let desiredZoom;
      if (state === 'intro') desiredZoom = 1.12;
      else if (state === 'answering' || state === 'launch') desiredZoom = 1.28;
      else if (state === 'flight') {
        const transition = ease(clamp(flightElapsed / 1.15, 0, 1));
        desiredZoom = lerp(1.28, .82, transition);
      } else desiredZoom = .82;
      camera.z = lerp(camera.z, desiredZoom, 1 - Math.exp(-dt * 9));
      // Do not ease camera position: a delay is enough to push a fast skier out
      // of frame. Lock to the exact current position after computing zoom.
      camera.x = p.x;
      camera.y = p.y - 39;
      return;
    }
    let desired;
    if(state==='intro'){
      desired={x:464,y:230,z:1.08,screenX:485,screenY:210};
    }else if(state==='answering' || state==='launch'){
      // Keep skier on right of the question card, at close zoom.
      desired={x:p.x-220/1.9,y:p.y+20/1.9,z:1.9,screenX:700,screenY:250};
    }else if(state==='flight'){
      const transition=ease(clamp(flightElapsed/1.15,0,1));
      const z=lerp(1.9,.78,transition);
      const sx=lerp(700,565,transition);
      const sy=lerp(250,250,transition);
      desired={x:p.x-(sx-W/2)/z,y:p.y-(sy-H/2)/z,z,screenX:sx,screenY:sy};
    }else{
      desired={x:p.x-110/.78,y:p.y+20/.78,z:.78,screenX:590,screenY:250};
    }
    const followRate=state==='flight'?16:state==='launch'?10:5;
    const k=1-Math.exp(-dt*followRate);
    camera.z=lerp(camera.z,desired.z,k);
    camera.x=lerp(camera.x,desired.x,k);
    camera.y=lerp(camera.y,desired.y,k);
    // Correct for residual lag in both axes. These bounds include the entire
    // skier silhouette and prevent camera easing from ever losing the subject.
    const marginLeft=state==='flight'?300:530;
    const marginRight=state==='flight'?670:810;
    const sx=W/2+(p.x-camera.x)*camera.z;
    if(sx<marginLeft)camera.x=p.x-(marginLeft-W/2)/camera.z;
    if(sx>marginRight)camera.x=p.x-(marginRight-W/2)/camera.z;
    const sy=H/2+(p.y-camera.y)*camera.z;
    if(sy<195)camera.y=p.y-(195-H/2)/camera.z;
    if(sy>350)camera.y=p.y-(350-H/2)/camera.z;
  }
  function render(now){if(finished)return;const dt=Math.min(.05,Math.max(0,(now-previous)/1000));previous=now;sceneTime+=dt;
    if(state==='answering'){remaining=Math.max(0,remaining-dt);elapsed+=dt;$('time').textContent=remaining.toFixed(1);$('timebox').classList.toggle('urgent',remaining<5);if(remaining<=0)takeoff()}
    if(state==='launch'){launchElapsed+=dt;if(launchElapsed>=.62){state='flight';flightElapsed=0;status('FLIGHT CAMERA / SKIER LOCKED')}}
    if(state==='flight'){flightElapsed+=dt;if(flightElapsed>=4.1){flightElapsed=4.1;endJump()}}
    const p=position();updateCamera(dt,p);
    ctx.save();ctx.setTransform(pixelScale,0,0,pixelScale,0,0);
    if (portrait) {
      ctx.save();ctx.scale(1,H/540);ctx.translate((W-960)/2,0);drawSky(sceneTime,camera.x);ctx.restore();
    } else drawSky(sceneTime,camera.x);
    ctx.translate(W/2,H/2);ctx.scale(camera.z,camera.z);ctx.translate(-camera.x,-camera.y);
    terrain();spectators();ramp();
    // Air trails and carved powder around skier while in motion.
    if(state==='answering'){for(let i=0;i<34;i++){const x=p.x-12-hash(i,9)*80,y=p.y+hash(i,12)*23-7;rect(x,y,1.1+hash(i,14)*2,1,'#d5f5ff')}}
    skier(p.x,p.y,p.angle,!!p.air,sceneTime);
    if(!portrait && (state==='intro' || state==='answering' || state==='launch')) drawAustenTag(p.x,p.y);
    ctx.restore();
    ctx.save();ctx.setTransform(pixelScale,0,0,pixelScale,0,0);
    if (portrait) {ctx.save();ctx.scale(W/960,H/540);snow(sceneTime,state==='answering'||state==='flight');ctx.restore();}
    else snow(sceneTime,state==='answering'||state==='flight');
    if(state==='answering'){for(let i=0;i<20;i++){const y=(portrait?95:140)+i*(portrait?21:18)+hash(i,62)*15;const x=(hash(i,64)*(W+140)+sceneTime*(90+i*4))%(W+140)-100;line(x,y,x-65-hash(i,72)*60,y+8,'#d3f1fa',i%4===0?1.6:.6)}}
    if (portrait && (state === 'intro' || state === 'answering' || state === 'launch')) {
      // A lightweight HUD tag: unlike the old world-space label, it does not
      // grow into an enormous banner as the camera zooms.
      rect(238, 219, 140, 25, '#273e5d');
      rect(241, 222, 134, 19, '#fff8eb');
      ctx.textAlign = 'left'; ctx.fillStyle = '#273e5d';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('UNCLE AUSTEN', 247, 235);
      line(242, 245, 218, 278, '#263c59', 2);
      polygon([[218, 278], [227, 273], [222, 284]], '#c4565c');
    }
    if(state==='flight'){ctx.textAlign='center';ctx.font='bold 12px monospace';rect(portrait?100:370,portrait?143:109,220,32,'#08233fe8');ctx.fillStyle='#e9f8fa';ctx.fillText(`LIVE DISTANCE  ${Math.floor(target*clamp(flightElapsed/4.1,0,1))} m`,portrait?210:480,portrait?163:129)}
    ctx.restore();frame=requestAnimationFrame(render);
  }
  const total=()=>scores.reduce((a,b)=>a+b,0);
  function dots(){$('progress').innerHTML=questions.map((_,i)=>`<span class="dot ${i<round?'done':i===round?'active':''}"></span>`).join('')}
  function status(s){$('status').textContent=s}
  function startRound(){if(round===0){runDay=new Date().toISOString().slice(0,10);submittedGuesses=[];}state='answering';elapsed=0;remaining=25;flightElapsed=0;answer='';$('intro').classList.add('hidden');$('intermission').classList.add('hidden');$('end').classList.add('hidden');$('panel').classList.remove('hidden');$('question').textContent=questions[round].q;$('eyebrow').textContent=`QUESTION ${String(round+1).padStart(2,'0')} / ${String(questions.length).padStart(2,'0')}`;$('round').textContent=`${String(round+1).padStart(2,'0')}/${String(questions.length).padStart(2,'0')}`;$('time').textContent='25.0';$('timebox').classList.remove('urgent');$('answer').value='';$('answer').focus();status('DROP IN / WIND SPEED RISING');dots()}
  function score(text){
    scoreFeedback=evaluateGuess(round,text);
    return scoreFeedback.distance;
  }

  function takeoff(){if(state!=='answering')return;answer=$('answer').value.trim();target=score(answer);submittedGuesses.push(scoreFeedback.guess);launchFrom=.025+ease(clamp(elapsed/25,0,1))*.975;launchElapsed=0;state='launch';flightElapsed=0;$('panel').classList.add('hidden');$('time').textContent='↗';status('FINAL APPROACH / TAKEOFF')}
  function endJump(){if(state!=='flight')return;state='intermission';scores.push(target);$('total').textContent=Math.round(total())+'m';$('jumpDistance').textContent=target.toFixed(1)+'m';$('resultKicker').textContent=`JUMP ${round+1} OF ${questions.length} — LANDED`;const guessText=scoreFeedback.guess===null?'NO VALID GUESS':String(scoreFeedback.guess);const diffText=scoreFeedback.difference===null?'—':String(scoreFeedback.difference);$('resultDetail').textContent=`${scoreFeedback.label.toUpperCase()} · YOUR GUESS: ${guessText} · ANSWER: ${scoreFeedback.answer} · OFF BY: ${diffText}`;$('resultText').textContent=scoreFeedback.explanation;$('next').textContent=round===questions.length-1?'VIEW FINAL RESULTS →':'NEXT JUMP →';$('intermission').classList.remove('hidden');status('LANDING CONFIRMED');dots()}
  function endGame(){state='end';$('intermission').classList.add('hidden');$('end').classList.remove('hidden');$('finalTotal').textContent=total().toFixed(1)+'m';$('summary').innerHTML=scores.map((x,i)=>`<span>JUMP ${i+1}<b>${x}m</b></span>`).join('');$('endMessage').textContent='All questions complete. Add your name below to submit your total to the daily leaderboard.';status('EVENT COMPLETE');window.dispatchEvent(new CustomEvent('ssx:finished',{detail:{guesses:[...submittedGuesses],day:runDay,total:total()}}))}
  $('form').addEventListener('submit',e=>{e.preventDefault();takeoff()},{signal:abort.signal});$('start').addEventListener('click',startRound,{signal:abort.signal});$('next').addEventListener('click',()=>{if(round===questions.length-1)endGame();else{round++;startRound()}},{signal:abort.signal});$('again').addEventListener('click',()=>{round=0;scores=[];$('total').textContent='0m';camera={x:464,y:230,z:1.08};window.dispatchEvent(new Event('ssx:restart'));startRound()},{signal:abort.signal});
  dots();frame=requestAnimationFrame(render);
  return ()=>{finished=true;abort.abort();cancelAnimationFrame(frame)};
}
