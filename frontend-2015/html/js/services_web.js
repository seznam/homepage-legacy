ServicesWeb = JAK.ClassMaker.makeClass({
  NAME: "ServicesWeb",
  VERSION: "0.1"
})

ServicesWeb.prototype.$constructor = function() {
  this._animation = new ServicesWeb.Animation();
}
