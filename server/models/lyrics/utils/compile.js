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
    const lastEndTime = Math.max(...displays);
    if (lastEndTime < line.startTime - 5) {
      // Assert there is a new paragraph since there are more than `ADVANCE`
      // seconds blank.
      newParagraph = true;
    }

    const priorEndTime = Math.min(...displays);
    let index = displays.indexOf(priorEndTime);
    if (newParagraph) {
      index = 0;
    }
    let advance = Math.max(line.startTime - priorEndTime, 0);
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
