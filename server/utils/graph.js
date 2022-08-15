class Point {
  x_;
  y_;

  constructor(x, y) {
    this.x_ = x;
    this.y_ = y;
  }

  x = () => {
    return this.x_;
  };

  y = () => {
    return this.y_;
  };
}

class Line {
  point1;
  point2;

  constructor(point1, point2) {
    this.point1 = point1;
    this.point2 = point2;
  }

  crossByX = (x) => {
    const x1 = this.point1.x();
    const x2 = this.point2.x();
    if (x1 === x2) {
      return new Point(NaN, NaN);
    }

    const y1 = this.point1.y();
    const y2 = this.point2.y();
    const y = ((x - x1) / (x2 - x1)) * (y2 - y1) + y1;
    return new Point(x, y);
  };

  crossByY = (y) => {
    const y1 = this.point1.y();
    const y2 = this.point2.y();
    if (y1 === y2) {
      return new Point(NaN, NaN);
    }

    const x1 = this.point1.x();
    const x2 = this.point2.x();
    const x = ((y - y1) / (y2 - y1)) * (x2 - x1) + x1;
    return new Point(x, y);
  };
}

class Polyline {
  points;

  constructor(points) {
    if (points.length < 2) {
      throw new Error(`unexpected points length "${points.length}"`);
    }
    this.points = points;
    this.points.sort((a, b) => a.x() - b.x());
  }

  crossByX = (_x) => {
    if (x < this.points[0].x()) {
      return new Line(this.points[0], this.points[1]).crossByX(x);
    }

    for (let i = 1; i < this.points.length - 1; i++) {
      if (x < this.points[i].x()) {
        return new Line(this.points[i - 1], this.points[i]).crossByX(x);
      }
    }

    return new Line(
      this.points[this.points.length - 2],
      this.points[this.points.length - 1]
    ).crossByX(x);
  };

  crossByY = (y) => {
    if (y < this.points[0].y()) {
      return new Line(this.points[0], this.points[1]).crossByY(y);
    }

    for (let i = 1; i < this.points.length - 1; i++) {
      if (y < this.points[i].y()) {
        return new Line(this.points[i - 1], this.points[i]).crossByY(y);
      }
    }

    return new Line(
      this.points[this.points.length - 2],
      this.points[this.points.length - 1]
    ).crossByY(y);
  };
}

export { Point, Line, Polyline };
