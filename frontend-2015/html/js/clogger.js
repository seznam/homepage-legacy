/**
 * trida zabyvajici se teckovanim pro QueryTrackerV2
 * logovani impresi je pomoci metody JAK.CLogger.logImperss()
 * logovani kliku pomoci metody JAK.CLogger.log()
 */

JAK.CLogger = JAK.ClassMaker.makeClass({
	NAME: 'JAK.CLogger',
	VERSION: '1.0',
	CLASS: 'static'
});

JAK.CLogger.URL = 'http://dot.seznam.cz';
JAK.CLogger.SID = 'nothing';

/**
 * log impress
 * @param type
 * @param sId
 * @param variable
 */
JAK.CLogger.logImpress = function(type,  variable) {
	var url = this.URL;
	url += '/?a=imp&t='+encodeURIComponent(type)+'&sId='+encodeURIComponent(this.SID);
	if ((type == 'other' || type == 'elem') && variable) {
		//url += '&v='+encodeURIComponent(this._serialize(variable));
		url += this._serialize(variable);
	}

	this._log(url);
	return false;
};

/**
 * log clicks
 * @param type
 * @param sId
 * @param variable
 * @param pos
 * @param cUrl
 */
JAK.CLogger.log = function(type, variable, pos, cUrl) {
	var url = this.URL;
	url += '/?a=clk&t='+encodeURIComponent(type)+'&sId='+encodeURIComponent(this.SID);
	if (variable) {
		url += this._serialize(variable);
		//url += '&v='+encodeURIComponent(this._serialize(variable));
	}
	if (pos) {
		url += '&pos='+encodeURIComponent(pos);
	}
	if (cUrl) {
		url += '&url='+encodeURIComponent(cUrl);
	}

	this._log(url);
	return false;
};


JAK.CLogger._serialize = function(data) {
	var url = '';
	for (var i in data) {
		url += '&' + i + '=' + encodeURIComponent(data[i]);
	}
	return url;
	/*if (!this.objLib) {
		this.objLib = new JAK.ObjLib();
	}
	return this.objLib.serialize(data);*/
};

JAK.CLogger._log = function(url) {
	url = url+'&r='+(new Date().getTime());
	var img = new Image(1,1);
	img.src = url;
};
