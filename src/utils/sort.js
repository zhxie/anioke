const alphabetic = (a, b, key) => {
  const av = a[key].toUpperCase();
  const bv = b[key].toUpperCase();

  if (av < bv) {
    return -1;
  }
  if (av > bv) {
    return 1;
  }

  return 0;
};

export { alphabetic };
