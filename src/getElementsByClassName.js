// If life was easy, we could just do things the easy way:
// var getElementsByClassName = function (className) {
//   return document.getElementsByClassName(className);
// };

// But instead we're going to implement it from scratch:
var getElementsByClassName = function(className) {

  var nodes = [];
  
  var checkClassName = function(node) {

    if (node.classList && node.classList.contains(className)) {
      nodes.push(node);
    }
    
    let children = node.childNodes;

    for (let i = 0; i < children.length; i++) {
      checkClassName(children[i]);
    }
    
  };

  checkClassName(document.body);

  return nodes;

};
