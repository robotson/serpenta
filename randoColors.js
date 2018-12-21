console.log("SERPENTA BY LANCE ROBOTSON DEC 2018");
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
///x is left and right
//y is up and down
//0,0 is left top world space

///woohoo

function randomColor(){
	const hexy = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	let color = "#";
	for(let i = 0; i < 6; i++){
		color += hexy[Math.floor(Math.random() * hexy.length)];
	}
	return color;
}

//style body
document.body.style.margin = 0;

//////STEP ONE: CREATE CANVAS;
const canvas = document.createElement('canvas');
const canvasSize = Math.min(window.innerWidth, window.innerHeight);

var scaleFactor = 2;
var pixel = Math.floor(canvasSize / scaleFactor);
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
document.body.appendChild(canvas);

const ctx = canvas.getContext('2d');



var x = 0;
var y = 0;

// for(let x = 0; x < canvasSize; x++){
// 	for(let y = 0; y < canvasSize; y++){
// 		ctx.fillStyle = randomColor();
// 		ctx.fillRect(x, y, 1, 1)
// 	}
// }
ctx.fillStyle = randomColor();

function doStuff(){
	if(x > canvas.width){
		y += pixel;
		x = 0;
	}
	if(y > canvas.height){
		y = 0;
		x = 0;
		scaleFactor++;
		pixel = canvasSize / scaleFactor;
	}
	if(scaleFactor == canvasSize){
		return;
	}
	ctx.fillStyle = randomColor();

	ctx.fillRect(x, y, pixel, pixel);
	x += pixel;
	window.requestAnimationFrame(doStuff);
}

window.requestAnimationFrame(doStuff);
