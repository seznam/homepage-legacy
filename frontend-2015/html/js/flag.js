JAK.Flags = JAK.ClassMaker.makeClass({
	NAME:"Flags",
	VERSION:"1.0"
});

JAK.Flags.prototype.$constructor = function () {
	this.flags = new Array();
};

JAK.Flags.prototype.init = function () {

};

JAK.Flags.prototype.addFlag = function (name, status) {
	for (var i = 0; i < this.flags.length; i++) {
		if(name === this.flags[i].name) {
			return 0;
		}
	}

	var flag = {
		name : name,
		status : status
	}

	this.flags[this.flags.length] = flag;
	return this.flags[this.flags.length-1];
};

JAK.Flags.prototype.removeFlag = function (name) {
	for (var i = 0; i < this.flags.length; i++) {
		if(name === this.flags[i].name) {
			return this.flags.splice(i,1);
			//break;
		}
	}

	return 1;
};

JAK.Flags.prototype.getFlagValue = function (name) {
	for (var i = 0; i < this.flags.length; i++) {
		if(name === this.flags[i].name) {
			return this.flags[i].status;
			break;
		}
	}

	return 1;
};

JAK.Flags.prototype.setFlagValue = function (name, status) {
	for (var i = 0; i < this.flags.length; i++) {
		if(name === this.flags[i].name) {
			this.flags[i].status = status;
			break;
		}
	}

	return 1;
};

JAK.flags = new JAK.Flags();
