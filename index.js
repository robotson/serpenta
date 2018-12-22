console.log("SERPENTA BY LANCE ROBOTSON DEC 2018");
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
const __DEBUG__ = false;
const __STEP__ = (1000 / 60) * 9;
var __PAUSED__ = false;
var __GAMEOVER__ = false;
var __EYES_CLOSED__ = false;
var __LEVEL_COMPLETE__ = false;
var _EYE_FACTOR_ = 5;

const _SIZE_ = Math.min(window.innerWidth, window.innerHeight);
const _SCALE_ = 12;
const _PIXEL_ = Math.floor(_SIZE_ / _SCALE_);
const _WIDTH_ = (Math.floor(window.innerWidth / _PIXEL_) * _PIXEL_) - _PIXEL_;
const _HEIGHT_ = (Math.floor(window.innerHeight/_PIXEL_) * _PIXEL_) - _PIXEL_;
const _GRID_WIDTH_ = _WIDTH_/_PIXEL_;
const _GRID_HEIGHT_ = _HEIGHT_/_PIXEL_;

const canvas = document.createElement('canvas');
const bg = document.createElement('canvas');

canvas.width = _WIDTH_;
canvas.height = _HEIGHT_;
bg.width = _WIDTH_;
bg.height = _HEIGHT_;

const ctx = canvas.getContext('2d');
const bg_ctx = bg.getContext('2d');
var eyeballs = [];

initializeBackground();

///append that canvas!
document.body.appendChild(canvas);

///create snake and apples
const apples = [];
const snek = new Snake(__DEBUG__, apples);
for(var i = 1; i> 0; i--){
	apples.push(new Apple(snek, eyeballs));
}

//create player and such
var player = new Player(document, __DEBUG__, snek);
__PAUSED__ = true;
window.requestAnimationFrame(introLoop);

function introLoop(timestamp){
	if(!__PAUSED__){
		initGame();
		return
	}

	window.requestAnimationFrame(introLoop);
}

//main game loop called with window.requestAnimationFrame
function main(timestamp) {
	if(__LEVEL_COMPLETE__){
		console.log("winner!");
		return;
	}
	if(__GAMEOVER__ && __PAUSED__){
		console.log("YOU LOSE");
		return;
	}

	if(!__PAUSED__){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		// ctx.drawImage(bg, 0,0);
		for(let apple of apples){
			apple.render();
		}
	
		checkEyes(eyeballs, snek);
	
		snek.update(timestamp);
		snek.render(timestamp);
	}

	window.requestAnimationFrame(main);
}




