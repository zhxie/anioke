import isWindows from "is-windows";

const binary = (name) => {
  if (isWindows()) {
    return `${name}.exe`;
  } else {
    return name;
  }
};

export default binary;
