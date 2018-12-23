class Player{
	constructor(document, __DEBUG__, snake){
		console.log("Player initialized");
		document.addEventListener('keyup', function (event) {
			// console.log("keyup detected");
			if (event.defaultPrevented) return;
			let key = event.key || event.keyCode;
			if (key === ' ' || key === '32') {
				if(__DEBUG__) console.log("SPACEBAR!");
				if((!__GAMEOVER__) && (!__LEVEL_COMPLETE__)){
					if(__PAUSED__){
						__PAUSED__ = false;
						unpauseGame();
					}
					else{
						__PAUSED__ = true;
					}
					
				}
				else{
					initGame();
				}
			}
			if (key === 'Escape' || key === 'Esc' || key === 27) {
				if(__DEBUG__) console.log("ESCAPE!");
			}
			if (key === 'a' || key === 'Left' || key === "ArrowLeft" || key === 65 || key === 37) {
				if(__DEBUG__) console.log("GO LEFT");
				snake.requestChangeDirection("LEFT");
			}
			if (key === 'd' || key === 'Right' || key === "ArrowRight" || key === 39 || key === 68) {
				if(__DEBUG__) console.log("GO RIGHT");
				snake.requestChangeDirection("RIGHT");
			}
			if (key === 'w' || key === 'Up' || key === "ArrowUp" || key === 38 || key === 87) {
				if(__DEBUG__) console.log("GO UP");
				snake.requestChangeDirection("UP");
			}
			if (key === 's' || key === 'Down' || key === "ArrowDown" || key === 40 || key === 83) {
				if(__DEBUG__) console.log("GO DOWN");
				snake.requestChangeDirection("DOWN");
			}
		});
	}
}
