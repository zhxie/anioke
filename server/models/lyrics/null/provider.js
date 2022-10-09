import Entry, { NAME } from "./entry";

class Provider {
  name = () => {
    return NAME;
  };

  configure = (_config) => {};

  searchByTitle = async (title) => {
    return this.searchByTitleAndArtist(title, "");
  };

  searchByTitleAndArtist = async (title, artist) => {
    return [new Entry(title, artist)];
  };

  get = async (id) => {
    const artist = id.split(".")[1];
    const title = id.split(".")[2];
    return new Entry(title, artist);
  };
}

export default Provider;
