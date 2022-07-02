import sqlite3 from "better-sqlite3";

class Database {
  db;

  constructor(path) {
    this.db = new sqlite3(path);
    this.db.exec(
      "CREATE TABLE IF NOT EXISTS mv ( id TEXT PRIMARY KEY, lyrics TEXT NOT NULL, offset DOUBLE NOT NULL )"
    );
  }

  select(mvId) {
    const record =
      this.db.prepare("SELECT * FROM mv WHERE id = ?").get(mvId) ?? {};
    return {
      lyrics: record.lyrics,
      offset: record.offset,
    };
  }

  bind(mvId, lyricsId) {
    const prev = this.select(mvId);
    if (prev.lyrics == lyricsId) {
      return;
    }

    this.updateLyrics(mvId, lyricsId);
  }

  updateLyrics(mvId, lyricsId) {
    this.db
      .prepare("INSERT OR REPLACE INTO mv VALUES (?, ?, 0)")
      .run(mvId, lyricsId);
  }

  updateOffset(mvId, offset) {
    this.db
      .prepare("UPDATE mv SET `offset` = ? WHERE id = ?")
      .run(offset, mvId);
  }
}

export default Database;
