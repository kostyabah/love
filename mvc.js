var d = document;

var compile = function(str){
  var html = [],
      index = 0
      start =0,
      end =0,   
      js = [];
  //console.log(str);
  start = str.indexOf('{{');      
  while(start >-1){
    
    html.push(str.slice(0, start));
    start += 2; 
    end = str.indexOf('}}');
    js.push(str.slice(start, end));
    end += 2;
    str = str.slice(end);
    //console.log(str)
    start = str.indexOf("{{")
    index++      
  }
  var repl = function(func){
    return func.replace(/-/g,"data.")
    
  }
  var func = "var result='' \n"
  
  for(var n=0; n < index; n++){
    func += repl("result += '"+html[n]+"'")
    .replace(/\[/g, "'+").replace(/\]/g, "+'")+"\n";
    func += repl(js[n]).replace(/\//g,"}")+"\n";
  }
  str = repl(str).replace(/\[/g, "'+")
  .replace(/\]/g, "+'")+"\n";
  str = "return result += '"+ str+ "'"
  func += str.split("\n").join(" ");
  
  return Function("data", func);
}


var App = function (el, data) {
  this._el = d.querySelector(el);

  this._tmpl = this._el.innerHTML
  .split("\n").join(" ")
  .replace(/\s+/g, " ");

  this._data = data
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
  })
  this.render();
  this.setEvent();
}

var equals = function(data, json){
  return JSON.stringify(data) == json;
}
App.prototype = {
  
  render : function(){
    if(!equals(this._data, this.json)){
      var render = compile(this._tmpl);
      this._el.innerHTML = render(this._data);
      this._json = JSON.stringify(this._data);    
    }
  },
  setEvent : function(){
    var data = this._data,
        app = this,
        el = this._el;
    var createCall = function(instr, vidjet, name){
      return function(e){
        //console.log(this);
        var that = this;
        var args = instr.map(function(method){
          return method(e, that);
        })
        var end = vidjet[name].apply(vidjet, args);
        vidjet.render();
        if(end !== undefined)
          return end;     
      }
    }
        
    Array.from(el.attributes)
    .forEach(function(attr){
  
      if(attr.name.indexOf("-") == -1)
        return;
      var args = attr.name.split("-");  
      var type = "on" + args.shift();
      
      var func = args.map(function(arg){
        return list[arg];
      })
      
      el[type] = createCall(func, app, attr.value); 
      
    })
          
  }
}

var list = {
  on : function(e, that){
    return that;  
  },
  dlg : function(e, that){
    return e.target
  },
  
  point : function(e, that){
    return {
      x : e.clientX - that.clientLeft,
      y : e.clientY - that.clientTop,
      which : e.which,
      shift : e.shiftKey,
      alt : e.altKey,
      ctrl : e.ctrlKey
    }
  }  
}     

