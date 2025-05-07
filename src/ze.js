
const fs = require("fs");

const { dirname, join } = require('path');

const PATH = require("path");

const START_TAG = /<&>/;
const END_TAG = /<\/&>/;

const DBG = false;

function json(obj) {
    return JSON.stringify(obj);
}

function __execute(js, context) {
    context = context || {};
    
    let _join = "";
    function join(res) {
        _join += "" + res;
    }
    context.exec_file = (path, ctx) => {
        return exec_file(PATH.join(context.exec_path, path), ctx);
    };
    context.join = join;
    context.json = json;

    if (DBG) {console.log(context)}

    let keys = Object.keys(context);
    let values = Object.values(context);
    let res = Function(...keys, js)(...values);
    if (res) {
        return "" + res;
    } else if (_join) {
        return _join;
    } else {
        return "";
    }
}

function exec(str, context) {
    context = context || {};
    if (!context.exec_path) {
        context.exec_path = __dirname;
    }
    if (!(str && str.length > 0)) {
        return;
    }
    let start = str.search(START_TAG);
    if (start < 0) {
        return str;
    }
    let end = str.search(END_TAG);
    if (end < start) {
        throw new Error("Syntax Error: no end tag");
    }
    let block = str.slice(start, end + 4);
    let res = str.replace(block, __execute(block.slice(3, -4), context));
    let next = exec(res, context);
    if (next) {
        return next;
    } else {
        return res;
    }
}

function exec_file(path, context) {
    context = context || {};
    let data = fs.readFileSync(path).toString();
    context.exec_path = dirname(path);
    return exec(data, context);
}

module.exports = {exec, exec_file};
