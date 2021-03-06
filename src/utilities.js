function colliding(a, b){
	return (a.x == b.x && a.y == b.y);
}

function pauseGame(){
	var screen = document.getElementById('pausedScreen');
	screen.style.display = "inline-block";
}

function unpauseGame(){
	var screen = document.getElementById('pausedScreen');
	screen.style.display = "none";
	window.requestAnimationFrame(main);
}

function initGame(){
	var screens = document.getElementsByClassName('overlayMode');
	for(let screen of screens){
		screen.style.display = "none";
	}
	
	__PAUSED__ = false;
	__GAMEOVER__ = false;
	__EYES_CLOSED__ = false;
	__LEVEL_COMPLETE__ = false;
	initializeBackground();
	snek.init();
	window.requestAnimationFrame(main);
}

function gameOver(){
	__PAUSED__ = true;
	__GAMEOVER__ = true;
	var screen = document.getElementById('gameOver');
	screen.style.display = "inline-block";
}

function levelComplete(){
	__LEVEL_COMPLETE__ = true;
	var screen = document.getElementById('winScreen');
	var eatScore = document.getElementById('eatScore');
	var bonus = document.getElementById('bonus');
	var total = document.getElementById('total');
	eatScore.innerText = snek.parts.length-5;
	var bonusCalc = Math.floor(100 * ((_EYE_FACTOR_ * 5)/snek.parts.length));
	bonus.innerText = bonusCalc;
	total.innerText = (snek.parts.length-5) + bonusCalc;
	screen.style.display = "inline-block";
	
}

function initializeBackground(){
	//create eyes
	eyeballs = [];
	createEyePath(eyeballs, _EYE_FACTOR_);

	/// draw background
	for(let y = 0; y < _HEIGHT_/_PIXEL_; y += 1){
		for(let x = 0; x < _WIDTH_/_PIXEL_; x += 1){
			bg_ctx.fillStyle = "#333333";
			if (((y%2==0) && (x%2==0))||((y%2==1) && (x%2==1)))
				bg_ctx.fillStyle = "#171717";
			bg_ctx.fillRect(x * _PIXEL_, y * _PIXEL_, _PIXEL_, _PIXEL_);
		}
	}

	// draw eyes on background
	for(let eye of eyeballs){
		eye.render();
	}
	//create background image from canvas
	var img = bg.toDataURL("image/png");
	canvas.style.backgroundImage = "url(" + img + ")";
}

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
	if(allCovered && !__EYES_CLOSED__){
		for(let apple of apples){
			apple.respawn();
			apple.makeGolden();
			
		}
		__EYES_CLOSED__ = true;
	}
}



function createEyePath(container, pathLength){
	var eyes = [];
	///pick a random point on the grid,
	var start = {x: Math.floor(Math.random() * _GRID_WIDTH_), y: Math.floor(Math.random() * _GRID_HEIGHT_), neighbors: []};
	eyes.push(start);
	///gather all it's valid neighbors into an array:
	//(a valid neighbor is any adjacent square that can be traveled to by hoping one square over in the x or y axis that hasn't already been traveled to)

	findNeighbors(start, eyes);
	while(eyes.length < pathLength*5){
		var current = eyes.pop();
		if(current.neighbors.length < 1){
			continue;
		}
		let rando = Math.floor(Math.random() * current.neighbors.length);
	
		let temp = current.neighbors[rando];
		current.neighbors[rando] = current.neighbors[current.neighbors.length-1];
		current.neighbors[current.neighbors.length-1] = temp;
		eyes.push(current);
	
		let nosy = current.neighbors.pop();
		findNeighbors(nosy, eyes);
		eyes.push(nosy);


	
	}
	for(var i = 0; i < eyes.length; i+=pathLength){
		container.push(new Eye(eyes[i].x, eyes[i].y));
	}
}


function findNeighbors(node, set){
	//check up:
	if(node.y - 1 >= 0){ /// if up isn't past the 0 bound
		//check if cell is already in our set:
		let occupied = false;
		for(let set_node of set){
			if(set_node.x == node.x && set_node.y == node.y-1){
				//bail
				occupied = true;
			}
		}
		if(!occupied){
			// console.log('pushed up')
			node.neighbors.push({x: node.x, y:node.y-1, neighbors: []})
		}
	}

	//check down:
	if(node.y + 1 < _GRID_HEIGHT_){ /// if down isn't past the Grid height bound
		//check if cell is already in our set:
		let occupied = false;
		for(let set_node of set){
			if(set_node.x == node.x && set_node.y == node.y+1){
				//bail
				occupied = true;
			}
		}
		if(!occupied){
				// console.log('pushed down')
			node.neighbors.push({x: node.x, y:node.y+1, neighbors: []})
		}
	}
	//check left:
	if(node.x - 1 >= 0){ /// if left isn't past the 0 bound
		//check if cell is already in our set:
		let occupied = false;
		for(let set_node of set){
			if(set_node.x == node.x - 1 && set_node.y == node.y){
				//bail
				occupied = true;
			}
		}
		if(!occupied){
				// console.log('pushed left')
			node.neighbors.push({x: node.x - 1, y: node.y, neighbors: []})
		}
	}

	//check right:
	if(node.x + 1 < _GRID_WIDTH_){ /// if right isn't past the Grid height bound
		//check if cell is already in our set:
		let occupied = false;
		for(let set_node of set){
			if(set_node.x == node.x + 1 && set_node.y == node.y){
				//bail
				occupied = true;
			}
		}
		if(!occupied){
				// console.log('pushed right')
			node.neighbors.push({x: node.x + 1, y:node.y, neighbors: []})
		}
	}
}



function randomColor(){
	const hexy = ['0','1','2','3','4','5','6','7','8','9','a','b','c','d','e','f'];
	let color = "#";
	for(let i = 0; i < 6; i++){
		color += hexy[Math.floor(Math.random() * hexy.length)];
	}
	return color;
}