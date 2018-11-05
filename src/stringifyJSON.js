// this is what you would do if you liked things to be easy:
// var stringifyJSON = JSON.stringify;

// but you don't so you're going to write it from scratch:

var stringifyJSON = function(obj) {

  if (typeof obj === 'function' || obj === undefined) {
    return;
  } else if (typeof obj === 'string') {
    return '"' + obj + '"';
  } else if (typeof obj === 'boolean' || typeof obj === 'number') {
    return obj.toString(); 
  } else if (obj === null) {
    return String(obj);
  } else if (Array.isArray(obj)) {
    let str = '';

    for (let i = 0; i < obj.length; i++) {
      str += stringifyJSON(obj[i]) + ',';
    }

    str = '[' + str.substring(0, str.length - 1) + ']';
    return str;
  } else if (typeof obj === 'object') {
    let str = '';
    for (let key in obj) {
      if (obj[key] !== undefined && typeof obj[key] !== 'function') {
        str += stringifyJSON(key) + ':' + stringifyJSON(obj[key]) + ',';
      }
    }
    str = '{' + str.substring(0, str.length - 1) + '}';
    return str;
  } 
};
