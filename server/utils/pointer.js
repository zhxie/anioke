class Pointer {
  i;

  constructor(i) {
    this.i = i ?? 0;
  }

  advance = (i) => {
    this.i += i;
    return this.i - i;
  };

  current = () => {
    return this.i;
  };
}

export default Pointer;
