const NAME = "youtube";

class Entry {
  videoId;
  title_;
  thumbnail_;
  channelTitle;
  channelThumbnail;

  constructor(videoId, title, thumbnail, channelTitle, channelThumbnail) {
    this.videoId = videoId;
    this.title_ = title;
    this.thumbnail_ = thumbnail;
    this.channelTitle = channelTitle;
    this.channelThumbnail = channelThumbnail;
  }

  id = () => {
    return `${this.source()}.${this.videoId}`;
  };

  title = () => {
    return this.title_;
  };

  subtitle = () => {
    return "";
  };

  uploader = () => {
    return this.channelTitle;
  };

  thumbnail = () => {
    return this.thumbnail_;
  };

  icon = () => {
    return this.channelThumbnail;
  };

  source = () => {
    return NAME;
  };

  url = () => {
    return `https://www.youtube.com/watch?v=${this.videoId}`;
  };

  downloadOptions = () => {
    return ["-f", "mp4"];
  };

  format = (lyrics) => {
    return {
      id: this.id(),
      title: this.title_,
      subtitle: "",
      uploader: this.channelTitle,
      thumbnail: this.thumbnail_,
      uploaderIcon: this.channelThumbnail,
      url: this.url(),
      lyrics: lyrics,
    };
  };
}

export { NAME };
export default Entry;
