(function(factory){
	this.xDropdown = factory();
})(function(){
	function Event(){
		this.events = {};
	}
	Event.prototype.on = function(eventName, cb){
		if(!this.events[eventName]){
			this.events[eventName] = [];
		}
		this.events[eventName].push(cb);
	};
	Event.prototype.trigger = function(eventName, data){
		var cbs = this.events[eventName];
		if(cbs){
			for(var i = 0; i < cbs.length; i++){
				cbs[i](data);
			}
		}
	};
	Event.prototype.unbind = function(eventName, cb){
		var cbs = this.events[eventName];
		if(cbs){
			for(var i = cbs.length - 1; i >= 0; i--){
				if(cbs[i] === cb){
					cbs.splice(i, 1);
				}
			}
		}
	};
	function Dropdown(options){
		Event.call(this);

		var defaultOptions = {
			container: document.body,
			listData: [], // [{id: , text: , image: }]
			type: 'text' // text|image-text
		};
		options = Object.setPrototypeOf(options, defaultOptions);
		this.options = options;

		this.selectedIndex = -1;
		this.listData = this.options.listData;
	}
	Dropdown.prototype = Object.create(Event.prototype);

	Dropdown.prototype.init = function(){
		this.initDom();
		this.initEvent();
		this.updateListData();
		return this;
	}
	Dropdown.prototype.initDom = function(){
		this.dom = document.createElement('div');
		this.dom.setAttribute('class', 'x-dropdown');

		this.inputDom = document.createElement('input');
		this.inputDom.setAttribute('class', 'input');

		this.loadingDom = document.createElement('img');
		this.loadingDom.setAttribute('class', 'loading');
		this.loadingDom.setAttribute('src', './../images/loading.gif');

		this.listDom = document.createElement('ul');
		this.listDom.setAttribute('class', 'list');
		this.listDom.setAttribute('tabindex', '-1');

		this.dom.appendChild(this.inputDom);
		this.dom.appendChild(this.loadingDom);
		this.dom.appendChild(this.listDom);
		this.options.container.appendChild(this.dom);
	}
	Dropdown.prototype.initEvent = function(){
		var hideDropdownList = true;
		this.inputDom.addEventListener('input', function(){
			this.showLoading(true);
			if(!this.inputDom.value){
				this.listDom.style.display = 'none';
				this.showLoading(false);
			}
			this.trigger('dropdown.input');
		}.bind(this));
		function unselected(){
			if(this.selectedIndex >= 0){
				Array.prototype.slice.call(this.listDom.children).forEach(function(o){
					o.classList.remove('selected');	
				});
			}
		}
		this.dom.addEventListener('keydown', function(e){
			if(this.listDom.style.display === 'none') return;
			switch(e.keyCode){
				case 38: 
					unselected.call(this);
					this.selectedIndex--;
					if(this.selectedIndex <= -1){
						this.selectedIndex = -1;
						this.inputDom.focus();
					}else {
						this.listDom.focus();
						if(this.selectedIndex >= 0){
							this.listDom.children[this.selectedIndex].classList.add('selected');
						}
					}
					break; // up
				case 40: 
					this.selectedIndex++;
					unselected.call(this);
					if(this.selectedIndex >= this.listData.length){
						this.selectedIndex = this.listData.length - 1;
					}
					this.listDom.focus();
					if(this.selectedIndex >= 0){
						this.listDom.children[this.selectedIndex].classList.add('selected');
					}
					break; // down
				case 32:
				case 13: 
					if(this.selectedIndex >= 0){
						this.inputDom.value = this.listData[this.selectedIndex].text;
						this.inputDom.focus();
						this.listDom.style.display = 'none';
						this.selectedIndex = -1;
						this.trigger('dropdown.select', { obj: this.listData[this.selectedIndex], index: this.selectedIndex});
						e.preventDefault();
					}
					break; // enter
			}

			this.trigger('dropdown.keydown');
		}.bind(this));
		
		var isMouseOn = false; // 控制chrome浏览器输入框在浏览器之外丢失焦点时会触发一次onblur，再次点击页面空白处时会触发onfocus和onblur的问题，firefox不会出现
		this.inputDom.addEventListener('focus', function(){
			if(isMouseOn){
				focus.call(this);
			}
		}.bind(this));
		this.inputDom.addEventListener('blur', function(){
			if(isMouseOn){
				blur.call(this);
			}
		}.bind(this));
		this.inputDom.addEventListener('mouseover', function(e){
			isMouseOn = true;
		});
		
		this.listDom.addEventListener('focus', focus.bind(this));
		this.listDom.addEventListener('blur', blur.bind(this));

		function blur(){

			isMouseOn = false;
			hideDropdownList = true;
			var timer = setTimeout(function(){
				if(hideDropdownList){
					this.listDom.style.display = 'none';
				}
				clearTimeout(timer);
			}.bind(this), 0);

			this.trigger('dropdown.blur');
		}
		function focus(){
			hideDropdownList = false;
			if(this.listData.length > 0){
				this.listDom.style.display = 'block';
			}
			this.trigger('dropdown.focus');
		}

		this.listDom.addEventListener('click', function(e){
			e.path.forEach(function(p){
				if(p.tagName && p.tagName.toLowerCase() == 'li'){
					var index = [].slice.call(this.listDom.children).indexOf(p);
					this.inputDom.value = this.listData[index].text;
					this.inputDom.focus();
					this.listDom.style.display = 'none';
					this.selectedIndex = -1;
					this.trigger('dropdown.select', { obj: this.listData[index], index: index});
				}
			}.bind(this));
		}.bind(this));
		
	}
	Dropdown.prototype.showLoading = function(isShow){
		if(isShow){
			this.loadingDom.style.display = 'block';
		}else{
			this.loadingDom.style.display = 'none';
		}
	}
	Dropdown.prototype.updateListData = function(data){
		this.showLoading(false);
		this.listData = data || this.listData;
		if(data && data.length > 0){
			this.listDom.style.display = 'block';
		}

		switch(this.options.type){
			case 'text': this.buildTextDom(); break;
			case 'image-text':this.buildImageTextDom(); break;
		}
	}
	Dropdown.prototype.buildTextDom = function(){
		var html = "";
		this.listData.forEach(function(o){
			html += "<li>" + o.text + "</li>";
		});
		this.listDom.innerHTML = html;
	}
	Dropdown.prototype.buildImageTextDom = function(){
		var html = "";
		this.listData.forEach(function(o){
			html += "<li><img src='" + o.image + "'><span>" + o.text + "</span></li>";
		});
		this.listDom.innerHTML = html;
	}
	Dropdown.prototype.getValue = function(){
		return this.inputDom.value;
	}
	Dropdown.prototype.setValue = function(value){
		this.inputDom.value = value;
	}
	return Dropdown;
});