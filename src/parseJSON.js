/*
 * parseJSON is an implementation of the JSON.parse(json) function.
 *
 * It uses a recursive descent parsing technique, whereby every time a
 * new grammar is found (shown below), its corresponding parsing 
 * function is called.
 *
 * JSON Grammar (from json.org):
 *   object
 *     {}
 *     { members }
 *   members
 *     pair
 *     pair , members
 *   pair
 *     string : value
 *   array
 *     []
 *     [ elements ]
 *   elements
 *     value 
 *     value , elements
 *   value
 *     string
 *     number
 *     object
 *     array
 *     true
 *     false
 *     null
 *
 */

var parseJSON = function parseJSON(json) {


  // ---------------- Start of helper objects and functions ------------- //


  // Escaped characters that have to be checked for (there might be others
  // missing).
  var escapee = ['\\\\', '\\r', '\\n', '\\t', '\\"'];



  // Returns the character index of the json string that contains the closing  
  // character value. E.g. '}' for '{', ']' for '[', and '"' for '"'. 
  // 
  // 1. If closeChar is ']' or '}', when parsing through the json string, if
  //    a '"' character is found, it means that what follows is a string so the
  //    function will jump to the end of the string to avoid any conflicting 
  //    characters that may be part of a string but could be parsed as closing
  //    characters.
  // 
  // 2. If closeChar is '"', the next appearance of '"' will be found.
  //
  // 
  // It uses a stack. It pushes every new opening character and pops every time
  // the corresponding closing character is found. 
  //
  // If, even after checking the entire json string, no corresponding closing
  // character is found for every opening character, i.e. stack.length > 0, a 
  // SyntaxError is thrown.
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

      // If escapee characters found, skip over them.
      } else if (json.length - current > 1 && escapee.indexOf(json.substr(current, 2)) >= 0) {
        current += 1;

      // Skipping over an entire string because it may have a '{', '}', '[', or ']'
      } else if (char === '"' && closeChar !== '"') {
        current += 1;
        current = getClosingIndex(current, '"');

        // Have to do this for strings because we still increment on line 101
        // at the end of the if and else if statements.
        current -= 1;
      } 

      current += 1;
      char = json.charAt(current);
    }

    // If stack's length > 0, means that all opening characters weren't paired 
    // up with their corresponding closing characters.
    if (stack.length > 0) {
      throw new SyntaxError('Not a valid JSON string.');
    }

    return current;
  };



  // Helper function to determine whether a character (or sequence of chars) 
  // are valid JavaScript number types. I.e. parse integers, decimals, 
  // and negative numbers. Don't parse NaN's.
  var isValidNum = function(start, char) {
    var isNum = typeof parseInt(char) === 'number' && !isNaN(parseInt(char));
    var isDecimal = json.length - start > 1 && char === '.' && !isNaN(json.substr(start, 2));
    var isNegative = json.length - start > 1 && char === '-' && !isNaN(json.substr(start, 2));

    return isNum || isDecimal || isNegative;
  };



  // Handy function for removing unparseable white space when values have been 
  // compvarely parsed and whitespace is not part of useful grammar for parsing.
  var removeWhiteSpace = function(start) {
    while (json.charAt(start) === ' ') {
      start += 1;
    }
    return start;
  };


  // ----------------------- end of helper functions -------------------- //




  // ------------------------  Parsing Objects  ------------------------- //


  // Returns a tuple with the parsed object and the index where it ended. 
  // 
  // Depends on getClosingIndex to obtain its ending index, which passed to 
  // getMembers so it can know the object's boundary.
  var getObject = function(obj, start) {
    var last = getClosingIndex(start, '}');
    getMembers(obj, start, last);
    return [obj, last];
  };


  // Get members of an object -> depends on getPair to add key-value pairs 
  // to the object passed into it.
  // 
  // Calls getPair when a new string (which will be the key) starts.
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


  // Get a member pair within an object -> depends on getString and getValue
  // 
  // getString returns the key and key's ending character index, and any 
  // unneeded whitespace (and one semicolon) is skipped until the next 
  // character is found. 
  //
  // getValue then parses the value corresponding to the key
  //
  // The object is augmented with the key and value, and the ending index of
  // the value is returned.
  var getPair = function(obj, start, end) {
    var key, start, value, endOfVal;

    [key, start] = getString(start, end);
    start += 1;
    start = removeWhiteSpace(start);

    // removeWhiteSpace won't skip over a semicolon, so we must ensure that 
    // if a semicolon (only one) is the next character in json, we skip it.
    start = json.charAt(start) === ":" ? start + 1 : start;

    [value, endOfVal] = getValue(start, end);

    // Augmenting the object
    obj[key] = value;
    return endOfVal;
  };


  // -------------------------------------------------------------------- //



  // -------------------------  Parsing Arrays  ------------------------- //


  // Returns a tuple with the parsed array and the index where it ended.
  //
  // Just like getObject, getArray depends on getClosingIndex to obtain the 
  // array's ending index, which is passed to getElements so it can know the 
  // object's boundary.
  var getArray = function(arr, start) {
    var endOfArr = getClosingIndex(start, ']');
    start = removeWhiteSpace(start);
    getElements(arr, start, endOfArr);
    return [arr, endOfArr];
  };


  // Augments the array by pushing every parsed value found.
  // -> depends on getValue function to be able to push it and start parsing
  // again at the value's ending index.
  var getElements = function(arr, start, last) {
    var value;

    while (start < last - 1) {
      start = removeWhiteSpace(start);
      [value, start] = getValue(start);
      arr.push(value);
      start += 1;
    }
  };


  // -------------------------------------------------------------------- //




  // -------------------------  Parsing Strings ------------------------- //


  // Returns a tuple with a parsed string and its ending index.
  // It uses Regular Expressions to filter out any escaped characters from 
  // the string it will return, which are not valid string characters in JSON.
  // 
  // TODO: Implement without the use of regex.
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


  // -------------------------------------------------------------------- //



  // -------------------------  Parsing Numbers ----------------------    //


  // Returns the parsed number and the index where it ends. 
  //
  // Uses a while loop and a flag to determine if the number that's being 
  // parsed is an actual number with only 1 decimal point and an optional 1 
  // starting negative sign. 
  //
  // Also, uses a StringBuilder, which is faster than a String Concatenator.
  var getNum = function(start) {
    var strNumBuilder = [];
    var hasOnlyOneDecimalPoint = false, negative = false;
    var char = json.charAt(start);
    var num, endOfNum;

    if (char === '-') {
      negative = true;
      start += 1;
      char = json.charAt(start);
    }

    while ((!isNaN(char) || ((char === '.') && !hasOnlyOneDecimalPoint)) && start < json.length) {
      if (!hasOnlyOneDecimalPoint && char === '.') {
        hasOnlyOneDecimalPoint = true;
      }

      strNumBuilder.push(json.charAt(start));
      start += 1;
      char = json.charAt(start);
    }

    num = +(strNumBuilder.join(''));
    num = negative ? -1 * num : num;
    endOfNum = start;
    return [num, endOfNum]
  };


  // -------------------------------------------------------------------- //




  // The overarching function that delegates to all other functions that parse
  // the value from the json string.
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

    } else if (isValidNum(start, char)) {
      [value, end] = getNum(start);

    } else if (json.length - start > 3 && json.substr(start, 4) === 'true') {
      value = true;
      end += 4;

    } else if (json.length - start > 4 && json.substr(start, 5) === 'false') {
      value = false;
      end += 5;

    } else if (json.length - start > 3 && json.substr(start, 4) === 'null') {
      value = null;
      end += 4;

    } else if (escapee.indexOf(char) >= 0) {
      start += 2;
      return getValue(start);

    } else {
      throw new SyntaxError();
    }

    return [value, end];
  };



  return getValue(0)[0];
};