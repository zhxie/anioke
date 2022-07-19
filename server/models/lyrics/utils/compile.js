const compile = (style, lines) => {
  const ASS_STYLES = ["K1", "K2"];
  const ADVANCE = 5;
  const DELAY = 1;

  let result = [];
  let displays = new Array(ASS_STYLES.length).fill(0);
  for (const line of lines) {
    if (line.isEmpty()) {
      continue;
    }

    // Calculate lyrics show in advance time.
    let newParagraph = false;
    const prevTime = Math.max(...displays);
    if (prevTime < line.startTime) {
      newParagraph = true;
    }

    const lastTime = Math.min(...displays);
    let index = displays.indexOf(lastTime);
    if (newParagraph) {
      index = 0;
    }
    let advance = Math.max(line.startTime - lastTime, 0);
    if (newParagraph) {
      advance = Math.min(advance, ADVANCE);
    }

    const assStyle = ASS_STYLES[index];
    result.push(line.compile(style, assStyle, advance, DELAY));

    if (newParagraph) {
      displays.fill(line.startTime - advance);
    }
    displays[index] = line.endTime + DELAY;
  }
  return result.join("\n");
};

export default compile;
