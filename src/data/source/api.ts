/* eslint-disable @typescript-eslint/no-empty-function */
import Conf from "../../utils/conf";

const DATA_MIRRORS = ["https://ak-data-2.sapk.ch/", "https://ak-data-1.sapk.ch/", "https://ak-data-3.sapk.ch/"];
const PROBE_TIMEOUT = 15000;

let selectedMirror = localStorage.getItem("selectedMirror") || DATA_MIRRORS[0];

let onMaintenance: (msg: string) => void = () => {};

export function setMaintenanceHandler(handler: (msg: string) => void) {
  onMaintenance = handler;
}

async function fetchWithTimeout(
  url: string,
  opts: Parameters<typeof fetch>[1] = {},
  timeout = 5000
): Promise<Response> {
  const abortController = window.AbortController ? new AbortController() : { signal: undefined, abort: () => {} };
  const timeoutToken = setTimeout(function () {
    abortController.abort();
  }, timeout);
  const ret = fetch(url, { ...opts, signal: abortController.signal }) as Promise<Response>;
  ret.then(() => clearTimeout(timeoutToken)).catch(() => clearTimeout(timeoutToken));
  return ret;
}

async function fetchData(path: string): Promise<Response> {
  try {
    return await fetchWithTimeout(selectedMirror + path);
  } catch (e) {
    console.warn(e);
    console.warn(`Failed to fetch data from mirror ${selectedMirror}, trying other mirror...`);
  }

  let completedResponse = null as null | Response;
  return Promise.race(
    DATA_MIRRORS.map((mirror) =>
      fetchWithTimeout(mirror + path, {}, PROBE_TIMEOUT)
        .then(function (resp) {
          if (completedResponse) {
            return resp;
          }
          completedResponse = resp;
          selectedMirror = mirror;
          localStorage.setItem("selectedMirror", selectedMirror);
          console.log(`Set ${mirror} as preferred`);
          return resp;
        })
        .catch(
          (e) =>
            new Promise((resolve, reject) =>
              setTimeout(() => {
                if (completedResponse) {
                  return resolve(completedResponse);
                }
                reject(e);
              }, PROBE_TIMEOUT)
            )
        )
    )
  ) as Promise<Response>;
}

let apiCache = {} as { [path: string]: unknown };

export async function apiGet<T>(path: string): Promise<T> {
  if (path in apiCache) {
    return apiCache[path] as T;
  }
  const resp = await fetchData(Conf.apiSuffix + path);
  if (!resp.ok) {
    const error = new Error("Failed API call");
    Object.assign(error, {
      response: resp,
      status: resp.status,
      statusText: resp.statusText,
      headers: resp.headers,
      url: resp.url,
      json: resp.json.bind(resp),
    });
    throw error;
  }
  const data = await resp.json();
  if (data.maintenance) {
    onMaintenance(data.maintenance);
    return new Promise(() => {}) as Promise<T>; // Freeze all other components
  }
  if (Object.keys(apiCache).length > 500) {
    apiCache = {};
  }
  apiCache[path] = data;
  return data as T;
}
