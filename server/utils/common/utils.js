class Utils {
  static sequence = 0;

  static generateSequence() {
    // Sequence starts from 1.
    return ++this.sequence;
  }
}

export { Utils };
