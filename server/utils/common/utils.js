import { exec } from "child_process";
import { promisify } from "util";

class Utils {
  static sequence = 0;

  static generateSequence() {
    // Sequence starts from 1.
    return ++this.sequence;
  }

  static exec(cmd) {
    return promisify(exec)(cmd);
  }
}

export default Utils;
