const _SIZE_ = Math.min(window.innerWidth, window.innerHeight);
const _SCALE_ = 12;
const _PIXEL_ = Math.floor(_SIZE_ / _SCALE_);
const _WIDTH_ = (Math.floor(window.innerWidth / _PIXEL_) * _PIXEL_) - _PIXEL_;
const _HEIGHT_ = (Math.floor(window.innerHeight/_PIXEL_) * _PIXEL_) - _PIXEL_;

const canvas = document.createElement('canvas');
canvas.width = _WIDTH_;
canvas.height = _HEIGHT_;

const _GRID_WIDTH_ = _WIDTH_/_PIXEL_;
const _GRID_HEIGHT_ = _HEIGHT_/_PIXEL_;

var eyeballs = []
createEyePath(eyeballs, 10);

const bg = document.createElement('canvas');
bg.width = _WIDTH_;
bg.height = _HEIGHT_;

const bg_ctx = bg.getContext('2d');

for(let y = 0; y < _HEIGHT_/_PIXEL_; y += 1){
	for(let x = 0; x < _WIDTH_/_PIXEL_; x += 1){
		bg_ctx.fillStyle = "#333333";
		if (((y%2==0) && (x%2==0))||((y%2==1) && (x%2==1)))
			bg_ctx.fillStyle = "#171717";
		bg_ctx.fillRect(x * _PIXEL_, y * _PIXEL_, _PIXEL_, _PIXEL_);
	}
}

for(let eye of eyeballs){
	eye.render();
}

var img = bg.toDataURL("image/png");
canvas.style.backgroundImage = "url(" + img + ")";

const ctx = canvas.getContext('2d');

document.body.appendChild(canvas);





