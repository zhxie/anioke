class Service {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl;
  }

  _buildUrl(path, params = {}) {
    const url = new URL(path, this.baseUrl);
    Object.keys(params).forEach((key) => {
      url.searchParams.set(key, params[key]);
    });
    return url.href;
  }

  async _request(fetchRequest) {
    return await (await fetchRequest).json();
  }

  async get(path, options = {}) {
    const { params } = options;
    return this._request(fetch(this._buildUrl(path, params)));
  }

  async post(path, options = {}) {
    const { params, body, ...otherOpts } = options;
    return this._request(
      fetch(this._buildUrl(path, params), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        ...otherOpts,
      })
    );
  }
}

let request = new Service({});
export const initService = (options) => {
  request = new Service(options);
};

export const getConnect = async () => {
  return request.get("/connect");
};

export const getLibrary = async () => {
  return request.get("/library");
};

export const getPlaylist = async () => {
  return request.get("/playlist");
};

export const searchMV = async (params) => {
  return request.get("/search", {
    params,
  });
};

export const searchLyrics = async (params) => {
  return request.get("/search", {
    params,
  });
};

export const requestOrder = async (data) => {
  return request.post("/order", {
    body: data,
  });
};

export const requestSkip = async () => {
  return request.post("/skip");
};

export const requestReplay = async () => {
  return request.post("/replay");
};

export const requestSwitch = async () => {
  return request.post("/switch");
};

export const requestShuffle = async () => {
  return request.post("/shuffle");
};

export const changeLyricsOffset = async (data) => {
  return request.post("/offset", {
    body: data,
  });
};

export const topmostSong = async (data) => {
  return request.post("/topmost", {
    body: data,
  });
};

export const retrySong = async (data) => {
  return request.post("/retry", {
    body: data,
  });
};

export const removeSong = async (data) => {
  return request.post("/remove", {
    body: data,
  });
};
