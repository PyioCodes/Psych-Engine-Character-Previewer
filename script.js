const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");

let img = null;
let atlas = [];
let animations = [];
let selectedAnim = null;
let frameIndex = 0;
let lastTime = 0;
let fps = 24;
let zoom = 1;
let flipX = false;
let flipY = false;

function $(id) { return document.getElementById(id); }

$("pngInput").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const url = URL.createObjectURL(f);
  img = new Image();
  img.src = url;
});

$("xmlInput").addEventListener("change", async e => {
  const f = e.target.files[0];
  if (!f) return;
  const text = await f.text();
  atlas = parseSparrowXML(text);
});

$("jsonInput").addEventListener("change", async e => {
  const f = e.target.files[0];
  if (!f) return;
  const text = await f.text();
  const json = JSON.parse(text);
  animations = json.animations || [];
  fps = animations[0]?.fps || 24;
  selectedAnim = animations[0]?.anim || null;
  updateAnimSelect();
});

$("animSelect").addEventListener("change", e => {
  selectedAnim = e.target.value;
  frameIndex = 0;
});

$("fpsInput").addEventListener("change", e => {
  fps = parseInt(e.target.value) || 24;
});

$("zoomRange").addEventListener("input", e => {
  zoom = parseFloat(e.target.value);
  $("zoomVal").textContent = zoom.toFixed(1) + "×";
});

$("flipX").addEventListener("click", () => flipX = !flipX);
$("flipY").addEventListener("click", () => flipY = !flipY);

function updateAnimSelect() {
  const sel = $("animSelect");
  sel.innerHTML = "";
  animations.forEach(anim => {
    const opt = document.createElement("option");
    opt.value = anim.anim;
    opt.textContent = anim.anim;
    sel.appendChild(opt);
  });
}

function parseSparrowXML(xmlText) {
  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, "application/xml");
  const subs = [...xml.getElementsByTagName("SubTexture")];
  return subs.map(s => ({
    name: s.getAttribute("name"),
    x: +s.getAttribute("x"),
    y: +s.getAttribute("y"),
    w: +s.getAttribute("width"),
    h: +s.getAttribute("height"),
    frameX: +(s.getAttribute("frameX") || 0),
    frameY: +(s.getAttribute("frameY") || 0),
    frameW: +(s.getAttribute("frameWidth") || s.getAttribute("width")),
    frameH: +(s.getAttribute("frameHeight") || s.getAttribute("height")),
  }));
}

function getFramesForAnim(animName) {
  const frames = atlas.filter(f => f.name.startsWith(animName));
  return frames.sort((a, b) => {
    const ai = parseInt(a.name.replace(/\\D+/g, "")) || 0;
    const bi = parseInt(b.name.replace(/\\D+/g, "")) || 0;
    return ai - bi;
  });
}

function loop(time) {
  requestAnimationFrame(loop);
  if (!img || !selectedAnim) return;

  const anim = animations.find(a => a.anim === selectedAnim);
  if (!anim) return;

  const frames = getFramesForAnim(anim.name || anim.anim);
  if (!frames.length) return;

  if (time - lastTime > 1000 / fps) {
    frameIndex = (frameIndex + 1) % frames.length;
    lastTime = time;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.scale(zoom * (flipX ? -1 : 1), zoom * (flipY ? -1 : 1));

  const fr = frames[frameIndex];
  ctx.drawImage(
    img,
    fr.x, fr.y, fr.w, fr.h,
    -fr.frameW / 2 + fr.frameX,
    -fr.frameH / 2 + fr.frameY,
    fr.w, fr.h
  );

  ctx.restore();
}

requestAnimationFrame(loop);