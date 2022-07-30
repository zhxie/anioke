const options = (values, t) => {
  return values.map((value) => {
    return {
      label: t(value),
      value: value,
    };
  });
};

export default options;
