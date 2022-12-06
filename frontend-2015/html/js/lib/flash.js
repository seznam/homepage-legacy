JAK.Flash = JAK.ClassMaker.makeStatic({
	NAME: "JAK.Flash",
	VERSION: "1.0"
});

JAK.Flash.version = {
	major: 0,
	minor: 0,
	revision: 0,
	raw: ''
}

JAK.Flash.detect = function(conf) {
	this._activeXDetectRules = [
		'ShockwaveFlash.ShockwaveFlash.7',
		'ShockwaveFlash.ShockwaveFlash.6',
		'ShockwaveFlash.ShockwaveFlash'
	];
	
	if (navigator.plugins && navigator.plugins.length > 0) {
		var type = 'application/x-shockwave-flash';
		var mimeTypes = navigator.mimeTypes;
		if (mimeTypes && mimeTypes[type] && mimeTypes[type].enabledPlugin && mimeTypes[type].enabledPlugin.description) {
			var version = mimeTypes[type].enabledPlugin.description;
			var descParts = version.split(/ +/);
			var mm = descParts[2].split(/\./);
			this.version = {
				'raw': version,
				'major': parseInt(mm[0], 10),
				'minor': parseInt(mm[1], 10), 
				'revision': parseInt(descParts[3].replace(/[a-zA-Z]/g, ""), 10) || this.version.revision
			};
		}
	} else if (JAK.Browser.platform != 'mac' && window.execScript) {
		var version = 0;
		for (var i = 0; i < this._activeXDetectRules.length && version == 0; i++) {
			var obj = this._getActiveXObject(this._activeXDetectRules[i]);
			if(obj){
				version = this._getActiveXVersion(obj);
				if (version!=0) {
					var versionArray = version.split(",");
					this.version = {
					    'raw': version,
						'major': parseInt(versionArray[0].split(" ")[1], 10),
						'minor': parseInt(versionArray[1], 10),
						'revision': parseInt(versionArray[2], 10)
					};
				}
			}
		}
	}
};

JAK.Flash._getActiveXVersion = function(activeXObj){
	try {
		return activeXObj.GetVariable("$version");
	} catch(ex) {}
	return 0;
};

JAK.Flash._getActiveXObject = function(name){
	try {
		return new ActiveXObject(name);
	} catch(ex) {}
	return null;
};

JAK.Flash.detect();
