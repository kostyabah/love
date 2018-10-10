function Mouse(tool){
    
    this.mousedown = function(point){
      	Mouse.count = 1
      	Mouse.press = true;
      	if(tool.open) 
        	tool.open(point)      
    }
    
    this.mousemove = function(point){
		Mouse.count = 0;
		if(Mouse.press && tool.change)
			tool.change(point);  
		else if(tool.focus)
			tool.focus(point)  
    }
    
    this.mouseup = function(point){
		Mouse.press = false;			
    }
    this.contextmenu = function(point){
		
		
		if(tool.other){
			tool.other(point);	
		}//else if(tool.callmenu);	
		return false;
    }
    this.click = function(point){
		
		if(tool.enter && Mouse.count){
			tool.enter(point);
			Mouse.count++;		
		}
		
    }
}
Mouse.count = 0;
Mouse.press = false;
function bind(_class){
		
	for(prop in _class)
	if(typeof _class[prop] == "function"){
		_class[prop] = _class[prop].bind(_class);  
	}

}
var Canvas = function(id, data, draw){
  	this._el = document.getElementById(id); 
	this._draw = draw;
	this._data = data;
	bind(this._data);
	this._holst = new Holst(this._el);
	var that = this;
	
	var getter = function(key){
		return function(){
			return that._data[key];
		}
	}
	var setter = function(key){
		return function(value){
			that._data[key] = value;
			that.render();
		}
	}
	Object.keys(that._data).forEach(function(key){
		Object.defineProperty(that, key, {
			get : getter(key),
			set : setter(key)
		})
	});
	
	
	this.render();
	//setEvent(control)
	//setInterval(this.render, 20);	
};
  

Canvas.prototype = {
  	get render() {
		var model = this._data,
			draw = this._draw,
			holst = this._holst;
		return function(){
			holst.clear();
			whitefill.call(holst.context);
			draw.call(holst, model);
		}
	},
	    
	on : function(handlers){
		//console.log(handlers);
		handlers = new Mouse(handlers);
		var self  = this;
		function getEvent(e, that){
			return {
				x : e.clientX - that.clientLeft,
				y : e.clientY - that.clientTop,
				which : e.which,
				shift : e.shiftKey,
				alt : e.altKey,
				ctrl : e.ctrlKey
			}
		}
		function createHandler(type, handler){
			
			return function(e){
				var point = getEvent(e, this);
				var target = self._holst.getHandler(type, point);
				var result;
				if(target){
					//console.log('hi');
					result = target(point);	
				}		
				else
					result = handler.call(self._data, point);
				if(type != 'mousedown' && type != 'mouseup')		
					self.render();
				
				return result
			}
			
		} 
		for(type in handlers){
			var handler = handlers[type];
			this._el[`on${type}`] = createHandler(type, handler);
		}
		return this;

	}, 
	animate : function(change){
		
		function getAnimate(that, change){
			return function(){
				change.call(that._data);
				that.render();
			}
		}
		return setInterval(getAnimate(this, change), 20);
	}
}

var ShapeStory = function(canvas){
	var copy = document.createElement("canvas");
	this.width = copy.width = canvas.width;
	this.heigth = copy.height = canvas.height;
	this.listen = copy.getContext("2d");
	whitefill.call(this.listen);
	this.init(new Path2D());
	this.list = [];
}

ShapeStory.prototype = {
	
  	isPoint: function(path, point) {
		this.listen.lineWidth = 5;
		this.listen.fill(path);
		this.listen.stroke(path);
		var color = this.listen
		.getImageData(point.x, point.y, 1, 1)
		.data;
		whitefill.call(this.listen);
		
		var flag = true,
			isAlfa = color[3] 
			value = 0;
		for(var n = 0; n < 3; n++){
			value += color[n]; 
			if(color[n]!=0) flag = false;
		}
			
		return value < 200 //flag;       
	},
	
	getHandlers: function(point){
		//console.log(this.list.length);
		for(var n=0; n < this.list.length; n++){
			var item = this.list[n]
			//console.log(item.handlers)
			if(this.isPoint(item.path, point) && item.handlers){
				return item.handlers;
			}
		}
		return false;
	},

	add: function(){
		this.list.unshift(this.active);
		//this.init();
	},
	init: function(path){
		this.active = {
			path: path
		}
	}
}

//---------@@@@@@@@@@@@@@@@@@@--------------------
function whitefill(){
	this.save();
	this.fillStyle = "rgb(255,255,255)";
	this.fillRect(0, 0, this.canvas.width, this.canvas.height);
	this.restore();	
}

var Holst = function(canvas){
	this.context = canvas.getContext("2d");	
	
	this.width = canvas.width;
	this.height = canvas.height;
	this.story = new ShapeStory(this);
}

function getFace(Parent){
	function getCall(prop){
		return function(){
			
			Parent[prop].apply(this.path, arguments)
			return this;
		}
	}
	var result = {
		clear : function(){
			this.story.list = [];
		},
		get active(){
			return this.story.active;
		},
		set active(value){
			this.story.active = value;
		},
		get path(){
			return this.active.path
		},
		get handlers() {
			return this.active.handlers
		},
		set handlers(value){
			this.active.handlers = value;
		},
		getHandler: function(type, point){
			//console.log(this.story.getHandlers(point));
			return this.story.getHandlers(point)[type];
		} 
	}
	for(prop in Parent){
		result[prop] = getCall(prop, Parent[prop]) 
	}
	return result;
}
Holst.prototype = getFace(Path2D.prototype);
Object.assign(Holst.prototype, {
	
	on : function(handlers){
		
		this.handlers = new Mouse(handlers) 
		return this;
	},
	
	each : function(array, func){
		var result = this;
		var object = result.caller
		array.forEach(function(elem, index){
			result = func.call(result, elem, index);
		});
		result.caller = object;
		return result;
	},
	fromto: function(func, from, to, step){
		step = step || 1;
		if(!to){
			to = from;
			from = 0;
		}
		var result = this;
		for(var n = from; n<to; n += step){
			result = func.call(result, n, to);
		}
		return result;
	},
	if : function(cond, yes, no){
		if(cond){
			return yes.call(this);
		}else if(no){
			return no.call(this);
		}else{
			return this;
		}
	},
	svg : function(text){
		this.story.init(new Path2D(text));
		return this;
	},
	_style : function(style){
		//this.context.closePath();
		this.context.save();
		this.context.lineWidth = style.lineWidth || 1;
		
		this.context.strokeStyle = getStyle(style.stroke, this.context);
		this.context.stroke(this.path);
		this.context.fillStyle = getStyle(style.fill, this.context);
		this.context.fill(this.path);
		
		this.context.restore();
		
		this.story.add();
		this.story.init(new Path2D());
		return this;  
	},
})
function getStyle(gamma, context){
	if(!gamma){
		return 'transparent'
	}
	if(typeof gamma == "string"){
		return gamma;
	}
	var gr;
	if(gamma.type == "radial"){
		gr = context.createRadialGradient
		.apply(context, gamma.param);
	}
	if(gamma.type == "line"){
		gr = context.createLinearGradient
		.apply(context, gamma.param);
	}
	for(weight in gamma.colors){
		var color = gamma.colors[weight];
		gr.addColorStop(parseInt(weight)/100, color);
	}

	return gr; 
}