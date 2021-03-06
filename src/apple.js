class Apple{
	constructor(snake, eyes){
		this.snake = snake;
		this.set_of_eyes = eyes;
		var position = this.findFreeCell();
		this.x = position.x;
		this.y = position.y;
		this.color = "red";
		this.golden = false;

	}

	makeGolden(){
		this.color = "gold";
		this.golden = true;
	}

	respawn(){
		this.golden = false;
		this.color = "red";
		var position = this.findFreeCell();
		this.x = position.x;
		this.y = position.y;
	}

	findFreeCell(){
		var x = Math.floor(Math.random() * (_WIDTH_ / _PIXEL_));
		var y = Math.floor(Math.random() * (_HEIGHT_ / _PIXEL_));
		for(let part of this.snake.parts){
			if(colliding({x:x, y:y}, part)){
				return this.findFreeCell();
			}
		}
		for(let eye of eyeballs){
			if(colliding({x:x, y:y}, eye)){
				return this.findFreeCell();
			}
		}
		return {x: x, y:y}
	}

	render(){
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x * _PIXEL_, this.y *_PIXEL_, _PIXEL_, _PIXEL_);
	}
}
