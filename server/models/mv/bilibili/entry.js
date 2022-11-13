const NAME = "bilibili";

class Entry {
  author;
  bvid;
  title_;
  pic;
  upic;
  page;
  part;
  cookies;

  // Too many props. Should be put into one config prop.
  constructor(author, bvid, title, pic, upic, page, part, cookies) {
    this.author = author;
    this.bvid = bvid;
    this.title_ = title;
    this.pic = pic;
    this.upic = upic;
    this.page = page;
    this.part = part;
    this.cookies = cookies;
  }

  id = () => {
    return `${this.source()}.${this.bvid}.${this.page}`;
  };

  title = () => {
    return this.title_;
  };

  subtitle = () => {
    return this.part;
  };

  uploader = () => {
    return this.author;
  };

  thumbnail = () => {
    return this.pic;
  };

  uploaderIcon = () => {
    return this.upic;
  };

  source = () => {
    return NAME;
  };

  url = () => {
    return `https://www.bilibili.com/video/${this.bvid}?p=${this.page}`;
  };

  downloadOptions = () => {
    if (this.cookies) {
      return ["--add-header", `cookie:${this.cookies}`];
    }
    return [];
  };

  encodeOptions = () => {
    return [];
  };

  format = (lyrics) => {
    return {
      id: this.id(),
      title: this.title_,
      subtitle: this.part,
      uploader: this.author,
      thumbnail: this.pic,
      uploaderIcon: this.upic,
      url: this.url(),
      lyrics: lyrics,
    };
  };
}

export { NAME };
export default Entry;
