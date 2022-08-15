import sqlite3 from "better-sqlite3";

const USER_VERSION = 1;

class Record {
  id;
  lyrics_;
  offset_;
  title_;
  artist_;

  constructor(id, lyrics, offset, title, artist) {
    this.id = id;
    this.lyrics_ = lyrics;
    this.offset_ = offset;
    this.title_ = title;
    this.artist_ = artist;
  }

  mv() {
    return this.id;
  }

  lyrics() {
    return this.lyrics_;
  }

  title() {
    return this.title_;
  }

  artist() {
    return this.artist_;
  }

  offset() {
    return this.offset_;
  }

  format() {
    return {
      mv: this.id,
      lyrics: this.lyrics_,
      title: this.title_,
      artist: this.artist_,
    };
  }
}

class Database {
  db;

  constructor(path) {
    this.db = new sqlite3(path);
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS mv ( id TEXT PRIMARY KEY, lyrics TEXT NOT NULL, offset DOUBLE NOT NULL )"
    );
  }

  async upgrade(getLyricsWithId) {
    // Upgrade.
    const record = this.db.prepare("PRAGMA user_version").get();
    const version = record["user_version"];
    switch (version) {
      case 0:
        this.db.exec(
          'ALTER TABLE mv ADD COLUMN title TEXT NOT NULL DEFAULT ""'
        );
        this.db.exec(
          'ALTER TABLE mv ADD COLUMN artist TEXT NOT NULL DEFAULT ""'
        );

        const records = this.selectAll();
        for (const record of records) {
          const lyrics = await getLyricsWithId(record.lyrics());
          this.updateLyricsAndOffset(record.mv(), lyrics, record.offset());
        }

        this.db.exec("PRAGMA user_version=1");
      case USER_VERSION:
        break;
      default:
        throw new Error(`unexpected database user version "${version}"`);
    }
  }

  select = (mvId) => {
    const record =
      this.db.prepare("SELECT * FROM mv WHERE id = ?").get(mvId) ?? {};
    return new Record(
      record["id"],
      record["lyrics"],
      record["offset"],
      record["title"],
      record["artist"]
    );
  };

  selectAll = () => {
    const records = this.db.prepare("SELECT * FROM mv").all();
    return records.map((record) => {
      return new Record(
        record["id"],
        record["lyrics"],
        record["offset"],
        record["title"],
        record["artist"]
      );
    });
  };

  bind = (mvId, lyrics) => {
    const prev = this.select(mvId);
    if (prev.lyrics() === lyrics.id()) {
      return;
    }

    this.updateLyrics(mvId, lyrics);
  };

  updateLyrics = (mvId, lyrics) => {
    this.db
      .prepare("INSERT OR REPLACE INTO mv VALUES (?, ?, 0, ?, ?)")
      .run(mvId, lyrics.id(), lyrics.title(), lyrics.artist());
  };

  updateOffset = (mvId, offset) => {
    this.db
      .prepare("UPDATE mv SET `offset` = ? WHERE id = ?")
      .run(offset, mvId);
  };

  updateLyricsAndOffset = (mvId, lyrics, offset) => {
    this.db
      .prepare("INSERT OR REPLACE INTO mv VALUES (?, ?, ?, ?, ?)")
      .run(mvId, lyrics.id(), offset, lyrics.title(), lyrics.artist());
  };
}

export default Database;
