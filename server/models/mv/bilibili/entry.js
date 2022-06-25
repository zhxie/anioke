const NAME = "bilibili";

class Entry {
  author;
  bvid;
  title_;
  page;
  part;

  constructor(author, bvid, title, page, part) {
    this.author = author;
    this.bvid = bvid;
    this.title_ = title;
    this.page = page;
    this.part = part;
  }

  id() {
    return `${this.source()}.${this.bvid}.${this.page}`;
  }

  title() {
    return this.title_;
  }

  subtitle() {
    return this.part;
  }

  uploader() {
    return this.author;
  }

  source() {
    return NAME;
  }

  url() {
    return `https://www.bilibili.com/video/${this.bvid}?p=${this.page}`;
  }
}

export { NAME };
export default Entry;
