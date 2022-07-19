import { exec as e } from "child_process";
import { promisify } from "util";

const exec = (cmd) => {
  return promisify(e)(cmd);
};

export default exec;
