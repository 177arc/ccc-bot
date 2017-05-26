'use strict';

const config = require('./config');
const dateFormat = require('dateformat');

const getCurrTimeString = () => {
  const now = new Date();
  return dateFormat(now, `d mmm yy HH:MM:ss l`);
};

const DEBUG = 'debug';
const INFO  = 'info';
const WARN  = 'warn';
const ERROR = 'error';

const levels = [DEBUG, INFO, WARN, ERROR];


const debug = (message) => {
  console.log(`[debug]`, `[${getCurrTimeString()}]`, message);
};

const info = (message) => {
  console.log(`[info] `, `[${getCurrTimeString()}]`, message);
};

const warn = (message) => {
  console.warn(`[warn] `, `[${getCurrTimeString()}]`, message);
};

const error = (message) => {
  console.error(`[error] `, `[${getCurrTimeString()}]`, message);
};

const funcs = {
  [DEBUG]: debug.bind(console),
  [INFO]: info.bind(console),
  [WARN]: warn.bind(console),
  [ERROR]: error.bind(console),
};

const noop = () => {}

const Logger = function(lvl) {
  this.level = lvl || INFO;

  levels.forEach((x) => {
    const should = levels.indexOf(x) >= levels.indexOf(lvl);
    this[x] = should ? funcs[x] : noop;
  });
};

module.exports = new Logger(config.level);
