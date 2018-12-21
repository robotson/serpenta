function colliding(a, b){
	return (a.x == b.x && a.y == b.y);
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