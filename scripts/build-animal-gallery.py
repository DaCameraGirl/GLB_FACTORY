"""Assemble genuine GLB render captures into an offline comparison gallery."""
from PIL import Image, ImageDraw, ImageFont
import base64, html, json, math, pathlib, sys, zipfile
root = pathlib.Path(sys.argv[1] if len(sys.argv)>1 else '../../outputs/animal-comparison').resolve()
frames_root = pathlib.Path(sys.argv[2] if len(sys.argv)>2 else '../animal-capture-frames').resolve()
before = {r['id']:r for r in json.loads((root/'before-manifest.json').read_text(encoding='utf-8'))['results']}
after = json.loads((root/'after-manifest.json').read_text(encoding='utf-8'))['results']
try:
 font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',22)
 small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
except OSError:
 font = ImageFont.load_default(); small = font

def data_image(p):
 mime='image/gif' if p.suffix=='.gif' else 'image/jpeg' if p.suffix=='.jpg' else 'image/png'
 return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode('ascii')

def clean_name(identifier):
 return {'gator':'Alligator','tigerfish':'Tiger Fish','lionfish':'Lionfish','hammerhead':'Hammerhead Shark','biped-lizard':'Biped Lizard','octopus':'Twelve-arm Octopus'}.get(identifier,identifier.title())

cards=[]
cols=4; tile_w=512; tile_h=252
sheet=Image.new('RGB',(cols*tile_w,math.ceil(len(after)/cols)*tile_h),'#fcfcfc');sd=ImageDraw.Draw(sheet)
for idx,item in enumerate(after):
 ident=item['id']; folder=root/ident;name=clean_name(ident)
 original=Image.open(folder/'before-threequarter.png').convert('RGB')
 frames=[]
 for f in sorted((frames_root/ident).glob('*.png')):
  im=Image.new('RGB',(1024,492),'#e9edf2');im.paste(original,(0,44));im.paste(Image.open(f).convert('RGB'),(512,44))
  d=ImageDraw.Draw(im);d.rectangle((0,0,1024,43),fill='#101a25');d.text((18,11),'BEFORE  /  static export',font=font,fill='#d6dce5');d.text((530,11),'AFTER  /  '+item['clips'][1]['name'],font=font,fill='#8dffc7');d.line((512,44,512,492),fill='#acb7c4',width=2)
  frames.append(im)
 if not frames:raise RuntimeError('No frames for '+ident)
 # A shared palette prevents color flicker between individual GIF frames.
 palette=frames[len(frames)//3].quantize(colors=128)
 indexed=[im.quantize(palette=palette,dither=Image.Dither.NONE) for im in frames]
 gif=folder/'comparison.gif';indexed[0].save(gif,save_all=True,append_images=indexed[1:],duration=max(40,int(item['duration']*1000/len(indexed))),loop=0,optimize=True,disposal=2)
 still=folder/'comparison.jpg';frames[len(frames)//5].save(still,quality=92)
 x=(idx%cols)*tile_w;y=(idx//cols)*tile_h
 thumb=Image.open(still).resize((512,246));sheet.paste(thumb,(x,y));sd.rectangle((x,y+222,x+512,y+252),fill='#ffffff');sd.text((x+10,y+227),name,font=small,fill='#172536')
 stats=f"{item['meshes']} meshes · {round(item['triangles']):,} triangles · {len(item['clips'])} animation clips"
 angles=''.join('<figure><img loading="lazy" src="'+data_image(folder/('after-'+view+'.png'))+'" alt="'+html.escape(name)+' '+view+' view"><figcaption>'+title+'</figcaption></figure>' for view,title in [('front','Front'),('side','Side')])
 cards.append(f'''<article data-name="{html.escape(name.lower())}" id="{ident}"><div class="card-head"><h2>{html.escape(name)}</h2><span>{html.escape(item['clips'][1]['name'])}</span></div><img class="comparison" loading="lazy" src="{data_image(still)}" data-still="{data_image(still)}" data-animation="{data_image(gif)}" alt="{html.escape(name)} original static GLB beside rebuilt animated GLB"><p class="stats">{stats}</p><div class="downloads"><a download href="{ident}/after.glb">Download animated GLB ↗</a><a class="subtle" download href="{ident}/before.glb">Original GLB</a></div><details><summary>Inspect front and side</summary><div class="angles">{angles}</div></details></article>''')

sheet.save(root/'all-animals-before-after.jpg',quality=90)
page='''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>GLB Factory — Animal Before & After</title><style>
*{box-sizing:border-box}body{margin:0;background:#07111c;color:#edf2f7;font:16px/1.6 system-ui,sans-serif}header,main,footer{max-width:1240px;margin:auto;padding:36px 28px}header{padding-top:62px;padding-bottom:20px}.eyebrow{color:#8dffc7;letter-spacing:.16em;font-size:12px;font-weight:800;text-transform:uppercase}h1{font-size:clamp(38px,6vw,72px);line-height:1.08;letter-spacing:-.05em;margin:20px 0}header p{max-width:850px;color:#b6c5d5;font-size:18px}.facts{display:flex;gap:12px;flex-wrap:wrap;margin:26px 0}.facts span{padding:8px 14px;border:1px solid #304356;border-radius:30px;color:#d6e7f5;font-size:13px}.toolbar{display:flex;gap:12px;flex-wrap:wrap;position:sticky;top:0;background:#07111cf2;z-index:10;padding:15px 0;backdrop-filter:blur(8px)}input,button{font:inherit;padding:11px 15px;border-radius:8px;border:1px solid #3b5167;background:#132334;color:#fff}input{flex:1;min-width:220px}button{cursor:pointer;background:#8dffc7;color:#0c251b;font-weight:700}.gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}article{border:1px solid #2c4054;background:#101f2f;border-radius:14px;overflow:hidden}.card-head{display:flex;align-items:center;justify-content:space-between;padding:16px 20px}.card-head h2{font-size:21px;margin:0}.card-head span{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#8dffc7}.comparison{display:block;width:100%;background:#e9edf2}.stats{font-size:12px;color:#a8bbcf;padding:0 20px}.downloads{display:flex;gap:18px;align-items:center;padding:0 20px 19px;flex-wrap:wrap}a{color:#8dffc7;text-decoration:none;font-weight:650;font-size:14px}a:hover{text-decoration:underline}.subtle{color:#afc0d2;font-size:12px}details{border-top:1px solid #2c4054;padding:12px 20px;font-size:13px;color:#c3d1e0}summary{cursor:pointer}.angles{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px}figure{margin:0}figure img{width:100%;border-radius:5px}figcaption{font-size:12px;text-align:center}footer{font-size:13px;color:#91a5ba}strong{color:#eff7ff}article[hidden]{display:none}@media(max-width:760px){header,main,footer{padding-left:18px;padding-right:18px}.gallery{grid-template-columns:1fr}.card-head h2{font-size:19px}}@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style><header><div class="eyebrow">GLB Factory / Character lab</div><h1>Every animal.<br>Now in motion.</h1><p>Original exports beside rebuilt, animated 3D animals. These are renders of the actual downloaded GLB files, reimported into a separate viewer — including the animation played from each file.</p><div class="facts"><span>22 animal presets</span><span>Idle + species motion in each new GLB</span><span>Front & side inspection views</span><span>All media works offline</span></div><p style="font-size:14px"><strong>What “before” means:</strong> the original animal geometry was already 3D, but its exported GLB had no animation clips. The left image shows that original static export. The right side plays the new file’s own locomotion clip. Each model is framed to fit, so size on the page is not a scale comparison.</p><div class="toolbar"><input id="search" type="search" aria-label="Find an animal" placeholder="Find an animal…"><button id="motion" type="button">Play animations</button></div></header><main><div class="gallery">'''+''.join(cards)+'''</div></main><footer><strong>Asset scope:</strong> stylized procedural characters with transform animations. These captures demonstrate geometry and embedded motion, not a promise of automatic compatibility with every game engine’s humanoid rig system. Download links work when this gallery stays beside its animal folders.<br><br>Baseline: commit 6f17c10. No external images, AI concept renders, or network services were used for these comparisons.</footer><script>
let playing=!matchMedia('(prefers-reduced-motion:reduce)').matches;const button=document.querySelector('#motion');function apply(){document.querySelectorAll('.comparison').forEach(i=>i.src=playing?i.dataset.animation:i.dataset.still);button.textContent=playing?'Pause animations':'Play animations';button.setAttribute('aria-pressed',playing);}button.addEventListener('click',()=>{playing=!playing;apply()});document.querySelector('#search').addEventListener('input',e=>{const q=e.target.value.toLowerCase().trim();document.querySelectorAll('article').forEach(a=>a.hidden=!a.dataset.name.includes(q))});apply();
</script></html>'''
(root/'index.html').write_text(page,encoding='utf-8')
with zipfile.ZipFile(root.parent/'GLB-Factory-Animal-Before-After.zip','w',zipfile.ZIP_DEFLATED) as archive:
 for p in root.rglob('*'):
  if p.is_file():archive.write(p,pathlib.Path('animal-comparison')/p.relative_to(root))
print('Gallery:',root/'index.html')
print('Archive:',root.parent/'GLB-Factory-Animal-Before-After.zip')
