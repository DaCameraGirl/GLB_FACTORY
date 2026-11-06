/** Capture real exported GLBs, reimported with GLTFLoader, at deterministic animation times. */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const checkout = path.resolve(process.argv[2] || path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));
const destination = path.resolve(process.argv[3] || path.join(checkout, '..', '..', 'outputs', 'animal-comparison'));
const phase = process.argv[4] || 'after';
const framesRoot = path.resolve(checkout, '..', 'animal-capture-frames');
const exclude = new Set(['gremlin', 'monster', 'clown', 'fairy']);
const html = `<!doctype html><html><body style="margin:0"><script type="module">
import * as THREE from '/node_modules/three/build/three.module.js';
import {GLTFLoader} from '/node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {buildAvatar} from '/src/utils/avatarBuilder.ts';
import {exportToGLB} from '/src/utils/glbExporter.ts';
import {CREATURE_VARIANTS} from '/src/constants/presets.ts';
const renderer = new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});
renderer.setSize(512,448); renderer.setPixelRatio(1); renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true; renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);
const scene=new THREE.Scene(); scene.background=new THREE.Color('#e9edf2');
scene.add(new THREE.HemisphereLight(0xffffff,0x657080,2.2));
const key=new THREE.DirectionalLight(0xffeddb,3.5); key.position.set(5,8,8); key.castShadow=true;
key.shadow.mapSize.set(1024,1024); key.shadow.camera.left=-10; key.shadow.camera.right=10; key.shadow.camera.top=10; key.shadow.camera.bottom=-10; key.shadow.bias=-.001;
scene.add(key);
const rim=new THREE.DirectionalLight(0xd2e2ff,2); rim.position.set(-4,5,-5); scene.add(rim);
const camera=new THREE.PerspectiveCamera(34,512/448,.01,200);
let model, floor, mixer, clip, box, center, distance;
const base={name:'',skinColor:'#e5a65d',hairColor:'#211510',clothingColor:'#1e3a8a',pantsColor:'#111827',shoesColor:'#ffffff',hairStyle:'none',bodyType:'normal',headShape:'organic-smooth',detailLevel:'medium',featherEdges:true,featherRadius:85,cropX:0,cropY:0,cropScale:1,photoMorphProgress:0,materialRoughness:.8,materialMetalness:.05,materialEmissive:'#000000',materialEmissiveIntensity:0};
window.presets=Object.entries(CREATURE_VARIANTS).map(([id,p])=>({id,label:p.label}));
window.loadAnimal=async(id)=>{
 if(model)scene.remove(model); if(floor)scene.remove(floor);
 const original=buildAvatar({...base,...CREATURE_VARIANTS[id],name:id,creatureVariant:id},null);
 const blob=await exportToGLB(original,id); const binary=await blob.arrayBuffer();
 const gltf=await new GLTFLoader().parseAsync(binary,'');
 model=gltf.scene; scene.add(model);
 model.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});
 box=new THREE.Box3().setFromObject(model); center=box.getCenter(new THREE.Vector3());
 const size=box.getSize(new THREE.Vector3());
 distance=Math.max(size.x,size.y,size.z)*2.3;
 floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.12}));
 floor.rotation.x=-Math.PI/2;floor.position.y=box.min.y-.015;floor.receiveShadow=true;scene.add(floor);
 mixer=new THREE.AnimationMixer(model);clip=gltf.animations[1]||gltf.animations[0];
 if(clip)mixer.clipAction(clip).play();
 const base64=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result.split(',')[1]);r.readAsDataURL(blob);});
 let meshes=0,triangles=0,skins=0;model.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.isSkinnedMesh)skins++;}});
 return {base64,label:CREATURE_VARIANTS[id].label,meshes,triangles,skins,bounds:size.toArray(),clips:gltf.animations.map(c=>({name:c.name,duration:c.duration,tracks:c.tracks.length})),duration:clip?.duration||2};
};
window.captureAnimal=(time=0,view='threequarter')=>{
 if(clip)mixer.setTime(time);
 const direction=view==='front'?new THREE.Vector3(0,.15,1):view==='side'?new THREE.Vector3(1,.2,.02):new THREE.Vector3(1,.42,1.45);
 direction.normalize();camera.position.copy(center).addScaledVector(direction,distance);camera.lookAt(center);camera.updateMatrixWorld();
 renderer.render(scene,camera);return renderer.domElement.toDataURL('image/png').split(',')[1];
};
window.captureReady=true;
</script></body></html>`;
const server = await createServer({root:checkout,configFile:false,server:{host:'127.0.0.1',port:0},plugins:[{name:'capture-page',configureServer(server){server.middlewares.use('/animal-capture',(_req,res)=>{res.setHeader('Content-Type','text/html');res.end(html);});}}]});
await server.listen();
const port=server.httpServer.address().port;
const browser=await chromium.launch({headless:true});
const results=[];
try{
 const page=await browser.newPage({viewport:{width:512,height:448}}); page.setDefaultTimeout(45000);
 const pageErrors=[];page.on('pageerror',e=>pageErrors.push(e.message));
 await page.goto('http://127.0.0.1:'+port+'/animal-capture');await page.waitForFunction(()=>window.captureReady);
 const presets=(await page.evaluate(()=>window.presets)).filter(p=>!exclude.has(p.id));
 for(const {id} of presets){
  const out=path.join(destination,id);await fs.mkdir(out,{recursive:true});
  const result=await page.evaluate(id=>window.loadAnimal(id),id);
  const bytes=Buffer.from(result.base64,'base64');delete result.base64;
  assert.equal(bytes.readUInt32LE(0),0x46546c67);assert.equal(bytes.readUInt32LE(8),bytes.length);
  const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
  for(const skin of gltf.skins||[])for(const joint of skin.joints)assert.ok(Number.isInteger(joint)&&gltf.nodes[joint]);
  assert.ok(result.meshes>0&&result.bounds.every(n=>Number.isFinite(n)&&n>0));
  if(phase==='after')assert.ok(result.clips.length>=2&&result.clips.every(c=>c.tracks>0&&c.duration>0),id+' requires exported animation clips');
  await fs.writeFile(path.join(out,phase+'.glb'),bytes);
  const stillTime=phase==='after'?result.duration*.2:0;
  for(const view of ['front','threequarter','side']){
   const png=await page.evaluate(({t,v})=>window.captureAnimal(t,v),{t:stillTime,v:view});
   await fs.writeFile(path.join(out,phase+'-'+view+'.png'),Buffer.from(png,'base64'));
  }
  if(phase==='after'){
   await fs.mkdir(path.join(framesRoot,id),{recursive:true});
   const distinctFrames = new Set();
   for(let f=0;f<24;f++){
    const png=await page.evaluate(t=>window.captureAnimal(t),result.duration*f/24);
    distinctFrames.add(png);
    await fs.writeFile(path.join(framesRoot,id,String(f).padStart(3,'0')+'.png'),Buffer.from(png,'base64'));
   }
   assert.ok(distinctFrames.size > 1, id + ' locomotion must visibly move');
   result.motionFrames = distinctFrames.size;
  }
  result.id=id;result.bytes=bytes.length;results.push(result);
  console.log('PASS',phase,id,result.meshes+' meshes',result.clips.map(c=>c.name).join(',')||'static GLB');
 }
 assert.deepEqual(pageErrors,[],'no uncaught render errors');
 await fs.writeFile(path.join(destination,phase+'-manifest.json'),JSON.stringify({phase,results},null,2));
}finally{await browser.close();await server.close();}
