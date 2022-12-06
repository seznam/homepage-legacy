/**
 * Slovnikovy suggest item zobrazuje naseptavany jazyk
 */
JAK.Suggest.Slovnik = JAK.ClassMaker.makeClass({
	NAME: "JAK.Suggest.Slovnik",
	VERSION: "1.0",
	EXTEND: JAK.Suggest.Item
});

JAK.Suggest.Slovnik.prototype._buildRelevance = function() {
	var span = JAK.cel("span", "relevance");
	var members = this.node.getElementsByTagName("member");
	for (var i=0;i<members.length;i++) {
		var member = members[i];
		if (member.getAttribute("name") == "lang") {
			span.innerHTML = member.getElementsByTagName("string")[0].firstChild.nodeValue;
		}
	}
	return span;
}
