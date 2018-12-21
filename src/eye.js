class Eye{
	constructor(x, y){
		this.x = x;
		this.y = y;
		this.covered = false;
	}
	render(){
		bg_ctx.fillStyle = "purple";
		bg_ctx.fillRect(this.x * _PIXEL_, this.y *_PIXEL_, _PIXEL_, _PIXEL_);
	}

}

