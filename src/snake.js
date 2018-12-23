class Snake {
	constructor(__DEBUG__, apples){
		console.log("Snake initialized");
		this.__DEBUG__ = __DEBUG__;
		this.parts = [];
		this.direction = {x: 1, y: 0};
		this.lastUpdated = 0;
		this.color = "green";
		this.dxMap = {	'-1': { '0': "LEFT" }, '0': { '-1': "UP", '1': "DOWN" }, '1': { '0': "RIGHT" } };
		this.mapDx = { "LEFT": {x:-1,y:0}, "RIGHT": {x:1,y:0}, "UP": {x:0,y:-1}, "DOWN": {x:0,y:1} };
		this.redness = 0;
		this.directionChangeQueue = [];
		this.apples = apples;
		this.lastPaused = -1;
		this.init();
	}

	pause(timestamp){ 
		this.lastPaused = timestamp;
		this.lastUpdated = timestamp - this.lastUpdated;
	}

	init(){

		var mid_x = Math.floor((_WIDTH_ / _PIXEL_)/2);
		var mid_y = Math.floor((_HEIGHT_ / _PIXEL_)/2); 
		this.redness = 0;
		this.directionChangeQueue = [];
		this.parts = [];
		this.direction = {x:mid_x, y: mid_y};
		this.lastUpdated = 0;
		this.direction = {x:-1, y:0};

		for(let i = 0; i < 5; i++){
			this.parts.push(new SnakePart(mid_x, mid_y));
		}
		for(let apple of this.apples){
			apple.respawn()
		}
	}

	requestChangeDirection(input){
		if(this.__DEBUG__){
			console.log("in request change direction");
			console.log(input, this.direction);
		}

		var nextDx = this.dxMap[""+this.direction.x][""+this.direction.y];

		if(this.directionChangeQueue.length > 0){

			nextDx = this.directionChangeQueue[this.directionChangeQueue-1];
		}

		if( (nextDx == input) ||
				(nextDx == "LEFT" && input == "RIGHT") ||
				(nextDx == "RIGHT" && input == "LEFT") ||
				(nextDx == "UP" && input == "DOWN") ||
				(nextDx == "DOWN" && input == "UP") ){ return; }

		this.directionChangeQueue.push(input)

	}

	update(timestamp){
		if(this.lastPaused > 0){
			this.lastPaused = -1;
			this.lastUpdated = timestamp - this.lastUpdated;
			return;

		}
		if(this.parts.length < 3 ){
			// your snake got too small and you died...
			// __PAUSED__ = true;
			// __GAMEOVER__ = true;
			gameOver();
			// this.init();
		} 

		if(timestamp - this.lastUpdated < __STEP__){
			// don't do anything until next step tick
			return;
		}

		var tail = this.parts[this.parts.length-1];
		var pentaTail = this.parts[this.parts.length-2];
		var head = this.parts[0];

		var new_x = head.x + this.direction.x;
		var new_y = head.y + this.direction.y;
		// if(this.__DEBUG__){ console.log(new_x, _WIDTH_ / _PIXEL_ ) }

		if(new_x >= _WIDTH_ / _PIXEL_){
			// HIT THE RIGHT WALL :(
			gameOver();
			// this.parts.shift();
			// this.init();
			return
			new_x = 0;
		}

		if(new_x < 0){
			// HIT THE LEFT WALL :(
			gameOver();
			// this.parts.shift();
			// this.init();
			return
			new_x = Math.floor(_WIDTH_/_PIXEL_) - 1;

		}
		if(new_y >= _HEIGHT_ / _PIXEL_){
			// HIT THE BOTTOM WALL :(
			gameOver();
			// this.parts.shift();
			// this.init();
			return
			new_y = 0;
		}
		if(new_y < 0){
			// HIT THE TOP WALL :(
			gameOver();	
			// this.parts.shift();
			// this.init();
			return
			new_y = Math.floor(_HEIGHT_/_PIXEL_)- 1;

		}  

		for(let part of this.parts){
			if(colliding({x: new_x, y: new_y}, part)){
				// CRASHED INTO YOURSELF :(
				// console.log("You Died");
				gameOver();
				// this.init();
				// this.parts.shift();

				return
			}
		}

		this.parts.unshift(new SnakePart(new_x, new_y));
		var eaten = false;

		for(let apple of this.apples){
			if(colliding({x: new_x, y: new_y}, apple)){
				//check if it's the final apple!
				if(apple.golden){
					// __PAUSED__ = true;
					// this.parts.shift();
					// this.parts.shift();
					levelComplete();
					return;
				}
				// this.parts.push(new SnakePart(pentaTail.x, pentaTail.y));
				eaten = true;
				console.log("Score!");
				apple.respawn();
				// this.redness = this.redness + 1;
			}
		}
		this.parts.pop();

		if(eaten) this.parts.push(new SnakePart(pentaTail.x, pentaTail.y));



		if(this.directionChangeQueue.length > 0){
			this.direction = this.mapDx[this.directionChangeQueue.shift()];
		}
		this.lastUpdated = timestamp;
	}

	render(timestamp){
		// ctx.fillStyle = this.color;

		var delta = Math.abs(__STEP__ / ( timestamp - this.lastUpdated));
		var slice = _PIXEL_ / delta;

		var nextDx = this.dxMap[""+this.direction.x][""+this.direction.y];
		var head = this.parts[0];
		var tail = this.parts[this.parts.length-1];
		var lastDx = "";

		if(this.parts.length < 3){
			lastDx = nextDx;
		}else{
			let pentaTail = this.parts[this.parts.length-2];
			let last_X = pentaTail.x - tail.x;
			let last_Y = pentaTail.y - tail.y;
			if(last_X < -1) last_X = 1;
			if(last_X > 1) last_X = -1;
			if(last_Y < -1) last_Y = 1;
			if(last_Y > 1) last_Y = -1;
			lastDx = this.dxMap[""+last_X][""+last_Y];
		}

		var colorStep = this.parts.length;
		const len = colorStep;

		for(let part of this.parts){

			// let red = this.redness;
			// let green = Math.floor(255 * (colorStep/len)) + len;
			// let blue = Math.max(len, 255-len) - Math.floor(100 * (colorStep/len));
			// let alpha = 1;

			let red = this.redness;
			let green = 255 - (len - colorStep);
			let blue = 0 + (len - colorStep);
			let alpha = Math.max(.66, (1-(colorStep/len)));


			colorStep--;
			if(part == head){
				green = 250;
				alpha = .77
			}
			ctx.fillStyle = "rgba(" + this.parts.length + ", " + green + ", " + blue + ", " + alpha + ")";
			// console.log(ctx.fillStyle);
			ctx.fillRect(part.x * _PIXEL_, part.y *_PIXEL_, _PIXEL_, _PIXEL_);
		}

		if(lastDx == "LEFT"){
			ctx.clearRect( (tail.x * _PIXEL_) + _PIXEL_ - slice, tail.y * _PIXEL_, slice, _PIXEL_);
		} else if(lastDx == "RIGHT"){
			ctx.clearRect( tail.x * _PIXEL_ , tail.y * _PIXEL_, slice, _PIXEL_);
		} else if(lastDx == "UP"){
			ctx.clearRect(tail.x * _PIXEL_, (tail.y * _PIXEL_) + _PIXEL_ - slice, _PIXEL_, slice);
		} else if(lastDx == "DOWN"){
			ctx.clearRect( tail.x * _PIXEL_, tail.y * _PIXEL_, _PIXEL_, slice);
		}
		ctx.fillStyle = 'rgba(' + this.parts.length + ', 245, 0, .88)';
		if(nextDx == "LEFT"){
			ctx.fillRect(((head.x * _PIXEL_) - slice), head.y * _PIXEL_, slice, _PIXEL_);
		} else if(nextDx == "RIGHT"){
			ctx.fillRect(((head.x * _PIXEL_) + _PIXEL_), head.y * _PIXEL_, slice, _PIXEL_);
		} else if(nextDx == "UP"){
			ctx.fillRect(head.x * _PIXEL_, ((head.y * _PIXEL_) - slice), _PIXEL_, slice);
		} else if(nextDx == "DOWN"){
			ctx.fillRect(head.x * _PIXEL_, ((head.y * _PIXEL_) + _PIXEL_), _PIXEL_, slice);
		}

	}
}


class SnakePart {
	constructor(x,y, direction){
		this.x = x;
		this.y = y;
		if(direction){
			this.direction = direction;
		}
		else{
			this.direction = {x: 0, y:0}
		}
	}

}
