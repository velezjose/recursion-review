/*
 * This function expression parses JSON strings into object literals, objects, array literals,
 * arrays, booleans, nulls, numbers and/or strings.  
 * 
 * Note: It doesn't work with escaped characters (yet) like \\, \r, \n, \t, \", etc.
*/

var parseJSON = function parseJSON(json) {
  let start = 0;
  let escapee = [`\\\\`, `\\r`, `\\n`, `\\t`, `\\"`];


  // If the next character in json === '{', this function gets called
  var getObject = function(obj, start) {
    var last = getClosingIndex(start, '}');
    getMembers(obj, start, last);
    return [obj, last];
  };


  /* 
   * Returns the character index that contains the closing character value using a stack,
   * whether it may be an
   * object, array or string. (yet to be modified for escaped characters...)
  */
  var getClosingIndex = function(current, closeChar, end) {
    var stack = [];
    var char = json.charAt(current);
    var openChar;
    end = end || json.length;

    if (closeChar === '}') {
      openChar = '{';
    } else if (closeChar === ']') {
      openChar = '[';
    } else if (closeChar === '"') {
      openChar = '"';
    }

    stack.push(openChar);
    while (current < json.length && stack.length > 0 && current < end) {
      if (char === openChar && openChar !== '"') {
        stack.push(openChar);

      } else if (char === closeChar) {
        stack.pop();        

      } else if (json.length - current > 1 && escapee.indexOf(json.substr(current, 2)) >= 0) {
        current += 1;

      // Skipping over an entire string because it may have a '{', '}', '[', or ']'
      } else if (char === '"' && closeChar !== '"') {
        current += 1;
        current = getClosingIndex(current, '"');
        current -= 1;
      } 

      current += 1;
      char = json.charAt(current);
    }

    if (stack.length > 0) {
      throw new SyntaxError();
    }

    return current;
  };

  // Used to obtain members of an object. It depends on getString and getValue.
  var getMembers = function(obj, current, end) {
    current = removeWhiteSpace(current);

    while (current < end) {
      var char = json.charAt(current);

      if (char === '"') {
        current = getPair(obj, current + 1, end);
      }

      current += 1;
    }
  };

  var getPair = function(obj, start, end) {
    var key, start, value, endOfVal;

    [key, start] = getString(start, end);

    start += 1;
    start = removeWhiteSpace(start);

    if (json.charAt(start) === ":" ) {
      start += 1;
    }

    [value, endOfVal] = getValue(start, end);

    obj[key] = value;

    if (Array.isArray(value)) {
      endOfVal -= 1;
    }

    return endOfVal;
  };

  var getArray = function(arr, start) {
    // value = getArray([], start + 1);
    // end = getClosingIndex(start + 1, ']');
    var last = getClosingIndex(start, ']');

    if (start === last - 1) {
      return [arr, last];
    }

    getElements(arr, start, last);
    return [arr, last + 1];
  };

  var getElements = function(arr, start, last) {
    var value;

    while (start < last - 1) {
      start = removeWhiteSpace(start);
      [value, start] = getValue(start);
      arr.push(value);
      start += 1;
    }
  };

  var getValue = function(start) {
    start = removeWhiteSpace(start);
    var char = json.charAt(start);
    var value;
    var end = start;

    if (char === '{') {
      [value, end] = getObject({}, start + 1);

    } else if (char === '[') {
      [value, end] = getArray([], start + 1);

    } else if (char === '"') {
      [value, end] = getString(start + 1);

    } else if (json.length - start > 3 && json.substr(start, 4) === 'null') {
      value = null;
      end += 4;

    } else if (json.length - start > 3 && json.substr(start, 4) === 'true') {
      value = true;
      end += 4;

    } else if (json.length - start > 4 && json.substr(start, 5) === 'false') {
      value = false;
      end += 5;

    } else if (typeof parseInt(char) === 'number' && !isNaN(parseInt(char))) {
      [value, end] = getNum(start);

    } else if (json.length - start > 1 && char === '.' && !isNaN(json.substr(start, 2))) {
      [value, end] = getNum(start);

    } else if (json.length - start > 1 && char === '-' && !isNaN(json.substr(start, 2))) {
      [value, end] = getNum(start);

    } else if (escapee.indexOf(char) >= 0) {
      start += 2;
      return getValue(start);

    } else {
      throw new SyntaxError();
    }

    return [value, end];
  };

  var getString = function(start, end) {
    var endOfStr = getClosingIndex(start, '"', end);
    var str = json.substr(start, endOfStr - start - 1);
    str = str.replace(/\\\\/g, '\\');
    str = str.replace(/\\r/g, '');
    str = str.replace(/\\n/g, '');
    str = str.replace(/\\t/g, '');
    str = str.replace(/\\"/g, '"');
    return [str, endOfStr]
  };

  var getNum = function(start) {
    var strNumBuilder = [];
    var onlyOneDecimalPoint = false;
    var negative = false;
    var char = json.charAt(start);

    if (char === '-') {
      negative = true;
      start += 1;
      char = json.charAt(start);
    }

    while ((!isNaN(char) || ((char === '.') && !onlyOneDecimalPoint) || ((char === '.') && !onlyStartingNegSign)) && start < json.length) {
      if (!onlyOneDecimalPoint && char === '.') {
        onlyOneDecimalPoint = true;
      }

      strNumBuilder.push(json.charAt(start));
      start += 1;
      char = json.charAt(start);
    }

    var num = +(strNumBuilder.join(''));
    num = negative ? -1 * num : num;
    var end = start;
    return [num, end]
  };

  var removeWhiteSpace = function(start) {
    while (json.charAt(start) === ' ') {
      start += 1;
    }
    return start;
  };

  return getValue(0)[0];
};