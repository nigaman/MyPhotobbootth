const pages = document.querySelectorAll(".page");
const video = document.getElementById("video");
const cameraBox = document.getElementById("cameraBox");
const canvas = document.getElementById("hiddenCanvas");
const ctx = canvas.getContext("2d");

const countdownEl = document.getElementById("countdown");
const flash = document.querySelector(".flash");

const startBooth = document.getElementById("startBooth");
const shootBtn = document.getElementById("shoot");
const toPrintBtn = document.getElementById("toPrint");
const downloadBtn = document.getElementById("download");

const preview = document.getElementById("preview");
const printArea = document.getElementById("printArea");

const frameColor = document.getElementById("frameColor");
const captionInput = document.getElementById("caption");

canvas.width = 320;
canvas.height = 240;

let imageData = null;
let stream = null;

// PAGE SWITCH
function showPage(i) {
  pages.forEach(p => p.classList.remove("active"));
  pages[i].classList.add("active");
}

// CAMERA START
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(s => {
      stream = s;
      video.srcObject = s;
    });
}

// CAMERA STOP + REMOVE VIDEO
function destroyCamera() {
  if (stream) stream.getTracks().forEach(t => t.stop());
  if (cameraBox) cameraBox.remove();
}

// COUNTDOWN
function countdown(sec) {
  return new Promise(res => {
    let n = sec;
    countdownEl.textContent = n;
    const t = setInterval(() => {
      n--;
      if (n === 0) {
        clearInterval(t);
        countdownEl.textContent = "";
        res();
      } else countdownEl.textContent = n;
    }, 1000);
  });
}

// CREATE POLAROID
function createPolaroid() {
  const tilt = (Math.random() * 6 - 3).toFixed(1) + "deg";
  const p = document.createElement("div");
  p.className = "polaroid";
  p.style.background = frameColor.value;
  p.style.setProperty("--tilt", tilt);
  p.innerHTML = `
    <img src="${imageData}">
    <div class="caption">${captionInput.value || "Instax Moment"}</div>
  `;
  return p;
}

// WELCOME → CAMERA
startBooth.onclick = () => {
  startCamera();
  showPage(1);
};

// TAKE PHOTO
shootBtn.onclick = async () => {
  await countdown(3);
  flash.style.opacity = 1;
  setTimeout(() => flash.style.opacity = 0, 150);

  ctx.drawImage(video, 0, 0, 320, 240);
  imageData = canvas.toDataURL("image/png");

  destroyCamera();

  preview.innerHTML = "";
  preview.appendChild(createPolaroid());
  showPage(2);
};

// CUSTOMIZE → PRINT
toPrintBtn.onclick = () => {
  printArea.innerHTML = "";
  const p = createPolaroid();
  p.style.animation = "eject 1s ease";
  printArea.appendChild(p);
  showPage(3);
};

// DOWNLOAD
downloadBtn.onclick = () => {
  const out = document.createElement("canvas");
  out.width = 260;
  out.height = 240 + 14 * 2 + 52;
  const octx = out.getContext("2d");

  octx.fillStyle = frameColor.value;
  octx.fillRect(0, 0, out.width, out.height);

  const img = new Image();
  img.src = imageData;
  img.onload = () => {
    octx.drawImage(img, 14, 14, 232, 240);
    octx.fillStyle = "#444";
    octx.font = "16px Comic Sans MS";
    octx.textAlign = "center";
    octx.fillText(
      captionInput.value || "Instax Moment",
      out.width / 2,
      out.height - 22
    );

    const a = document.createElement("a");
    a.download = "instax-polaroid.png";
    a.href = out.toDataURL();
    a.click();
  };
};
