console.log("SERPENTA BY LANCE ROBOTSON DEC 2018");
console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
const __DEBUG__ = false;
const __STEP__ = (1000 / 60) * 9;
var __PAUSED__ = false;


const apples = [];
const snek = new Snake(__DEBUG__, apples);
for(var i = 1; i> 0; i--){
	apples.push(new Apple(snek, eyeballs));
}


var player = new Player(document, __DEBUG__, snek);






function main(timestamp) {

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

window.requestAnimationFrame(main);


function checkEyes(eyes, snake){
	for(let eye of eyes){
		let collision = false;
		for(let part of snake.parts){
			if(colliding(eye, part)){
				collision = true;
			}
		}
		eye.covered = collision;
	}
	var allCovered = true;
	for(let eye of eyes){
		if(!eye.covered) allCovered = false;
	}
	if(allCovered) alert("you win!");
}
