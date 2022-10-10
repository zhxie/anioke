const NAME = "ncm";

class Entry {
  id_;
  name;
  artist;
  artistImg;
  album;
  albumPicUrl;
  mvid;

  constructor(id, name, artist, artistImg, album, albumPicUrl, mvid) {
    this.id_ = id;
    this.name = name;
    this.artist = artist;
    this.artistImg = artistImg;
    this.album = album;
    this.albumPicUrl = albumPicUrl;
    this.mvid = mvid;
  }

  id = () => {
    return `${this.source()}.${this.id_}`;
  };

  title = () => {
    return this.name;
  };

  subtitle = () => {
    return this.album;
  };

  uploader = () => {
    return this.artist;
  };

  thumbnail = () => {
    return this.albumPicUrl;
  };

  icon = () => {
    return this.artistImg;
  };

  source = () => {
    return NAME;
  };

  url = () => {
    return `https://music.163.com/mv?id=${this.mvid}`;
  };

  downloadOptions = () => {
    return ["-f", "mp4"];
  };

  encodeOptions = () => {
    return ["-vcodec", "copy"];
  };

  format = (lyrics) => {
    return {
      id: this.id(),
      title: this.name,
      subtitle: this.album,
      uploader: this.artist,
      thumbnail: this.albumPicUrl,
      uploaderIcon: this.artistImg,
      url: this.url(),
      lyrics: lyrics,
    };
  };
}

export { NAME };
export default Entry;
