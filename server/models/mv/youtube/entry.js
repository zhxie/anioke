const NAME = "youtube";

class Entry {
  videoId;
  title_;
  channelTitle;

  constructor(videoId, title, channelTitle) {
    this.videoId = videoId;
    this.title_ = title;
    this.channelTitle = channelTitle;
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
      url: this.url(),
      lyrics: lyrics,
    };
  };
}

export { NAME };
export default Entry;
