import { Style } from "../common";

const NAME = "null";

class Entry {
  title_;
  artist_;

  constructor(title, artist) {
    this.title_ = title;
    this.artist_ = artist;
  }

  id = () => {
    return `${this.source()}.${this.artist_}.${this.title_}`;
  };

  title = () => {
    return this.title_;
  };

  artist = () => {
    return this.artist_;
  };

  style = () => {
    return Style.Traditional;
  };

  source = () => {
    return NAME;
  };

  format = async (withLyrics) => {
    return {
      id: this.id(),
      title: this.title_,
      artist: this.artist_,
      style: this.style(),
      lyrics: withLyrics ? await this.lyrics() : "",
    };
  };

  lyrics = async () => {
    return "";
  };

  formattedLyrics = async () => {
    return [];
  };
}

export { NAME };
export default Entry;
