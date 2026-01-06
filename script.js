const pages = document.querySelectorAll(".page");

const startBoothBtn = document.getElementById("startBooth");
const shootBtn = document.getElementById("shoot");
const toPrintBtn = document.getElementById("toPrint");
const downloadBtn = document.getElementById("download");

const preview = document.getElementById("preview");
const printArea = document.getElementById("printArea");
const qrCanvas = document.getElementById("qrCanvas");

const frameColor = document.getElementById("frameColor");
const caption = document.getElementById("caption");

const countdownEl = document.getElementById("countdown");
const flash = document.querySelector(".flash");

const PHOTO_W = 320;
const PHOTO_H = 240;

const cameraCanvas = document.createElement("canvas");
cameraCanvas.width = PHOTO_W;
cameraCanvas.height = PHOTO_H;
const cameraCtx = cameraCanvas.getContext("2d");

let stream = null;
let imageData = null;
let polaroidData = null;

/* ---------- PAGE ---------- */
function showPage(i) {
  pages.forEach(p => p.classList.remove("active"));
  pages[i].classList.add("active");
}

/* ---------- CAMERA ---------- */
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true }).then(s => {
    stream = s;
    document.getElementById("video").srcObject = s;
  });
}

function destroyCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
  }
}

/* ---------- COUNTDOWN ---------- */
function countdown(sec) {
  return new Promise(res => {
    let n = sec;
    countdownEl.textContent = n;
    const i = setInterval(() => {
      n--;
      if (n === 0) {
        clearInterval(i);
        countdownEl.textContent = "";
        res();
      } else countdownEl.textContent = n;
    }, 1000);
  });
}

/* ---------- DATE ---------- */
function getSketchDate() {
  return new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

/* ---------- PREVIEW ---------- */
function createPolaroidPreview() {
  const p = document.createElement("div");
  p.className = "polaroid";
  p.style.background = frameColor.value;

  p.innerHTML = `
    <img src="${imageData}">
    <div class="caption">${caption.value || "Instax Capture"}</div>
    <div class="polaroid-date" style="transform: rotate(${Math.random()*4-2}deg)">
      ${getSketchDate()}
    </div>
  `;
  return p;
}

/* ---------- FINAL IMAGE ---------- */
function createPolaroidImage() {
  const out = document.createElement("canvas");
  out.width = 260;
  out.height = PHOTO_H + 80;
  const o = out.getContext("2d");

  o.fillStyle = frameColor.value;
  o.fillRect(0, 0, out.width, out.height);

  const img = new Image();
  img.src = imageData;

  return new Promise(resolve => {
    img.onload = () => {
      o.drawImage(img, 12, 12, 236, PHOTO_H);

      o.fillStyle = "#222";
      o.font = "18px Patrick Hand";
      o.textAlign = "center";
      o.fillText(caption.value || "Instax Capture", out.width / 2, PHOTO_H + 34);

      o.save();
      o.translate(out.width / 2, PHOTO_H + 58);
      o.rotate((Math.random()*4-2) * Math.PI / 180);
      o.font = "13px Handlee";
      o.fillStyle = "rgba(0,0,0,0.55)";
      o.fillText(getSketchDate(), 0, 0);
      o.restore();

      resolve(out.toDataURL("image/png"));
    };
  });
}

/* ---------- CLOUDINARY ---------- */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function uploadToCloudinary(base64, id) {
  const fd = new FormData();
  fd.append("file", base64);
  fd.append("upload_preset", "photobooth_unsigned");
  fd.append("public_id", "photobooth/" + id);

  const r = await fetch(
    "https://api.cloudinary.com/v1_1/dsn45eqfl/image/upload",
    { method: "POST", body: fd }
  );

  const j = await r.json();
  return j.secure_url;
}

/* ---------- QR ---------- */
function generateQR(url) {
  const size = 180;
  qrCanvas.width = size;
  qrCanvas.height = size;

  const img = new Image();
  img.src =
    "https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=" +
    encodeURIComponent(url);

  img.onload = () => qrCanvas.getContext("2d").drawImage(img, 0, 0, size, size);
}

/* ---------- FLOW ---------- */
startBoothBtn.onclick = () => {
  startCamera();
  showPage(1);
};

shootBtn.onclick = async () => {
  await countdown(3);
  flash.style.opacity = 1;
  setTimeout(() => flash.style.opacity = 0, 150);

  const video = document.getElementById("video");
  cameraCtx.drawImage(video, 0, 0, PHOTO_W, PHOTO_H);
  imageData = cameraCanvas.toDataURL("image/png");

  destroyCamera();

  preview.innerHTML = "";
  preview.appendChild(createPolaroidPreview());
  showPage(2);
};

toPrintBtn.onclick = async () => {
  printArea.innerHTML = "";
  printArea.appendChild(createPolaroidPreview());

  polaroidData = await createPolaroidImage();
  const url = await uploadToCloudinary(polaroidData, uid());
  generateQR(url);

  showPage(3);
};

downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = polaroidData;
  a.download = "polaroid.png";
  a.click();
};
