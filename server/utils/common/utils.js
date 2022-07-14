import { exec } from "child_process";
import isWindows from "is-windows";
import { promisify } from "util";

class Utils {
  static sequence = 0;

  static generateSequence() {
    // Sequence starts from 1.
    return ++Utils.sequence;
  }

  static exec(cmd) {
    return promisify(exec)(cmd);
  }

  static shuffle(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  static binary(name) {
    if (isWindows()) {
      return `${name}.exe`;
    } else {
      return name;
    }
  }
}

export default Utils;
