const cheerio = require("cheerio");
const { gotScraping } = require('got-scraping');

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com"

router.get(["/popular", "/popular/:cat"], async (req, res) => {
  try {
    let url = `${baseUrl}/browse/popular/all`;

    if (req.params.cat === "movies") {
      url = `${baseUrl}/browse/popular/film/1`;
    }
    if (req.params.cat === "series") {
      url = `${baseUrl}/browse/popular/series/1`;
    }
    if (req.params.cat === "music") {
      url = `${baseUrl}/browse/popular/music/1`;
    }


    const { body } = await gotScraping(url);
    const $ = cheerio.load(body);

    let results = {};

    $("table tr").each((i, tr) => {
      const td = $(tr).find("td.a1 a");
      const authorLink = $(tr).find("td.a5 a");

      if (td.length > 0) {
        let language = td.find("span.l.r.neutral-icon , .l.r.positive-icon, .l.r.bad-icon").text().trim() || null;
        let filmTitle = td.find(".new").text().trim() || null;
        let path = td.attr("href") || null;
        let type = $(tr).find("td.a3").text().trim() || null;
        let uploaded = $(tr).find("td.a6").text().trim() || null;
        let downloads = $(tr).find("td.a7").text().trim() || null;
        let author = authorLink.text().trim() || null;
        let authorProfile = baseUrl + authorLink.attr("href") || null;

        // console.log(language);

        if (language !== "") {
          if (!results[language]) {
            results[language] = [];
          }
          results[language].push({ path, filmTitle, type, uploaded, downloads, author, authorProfile});
        }
      }
    });

    cleanUpResults(results);

    return res.json(results);

  } catch (err) {
    console.log(err);
    res.status(500).json("Error while fetching data");
  }
});

router.get(["/latest", "/latest/:cat"], async (req, res) => {
  try {
    let url = `${baseUrl}/browse/latest/all`;

    if (req.params.cat === "movies") {
      url = `${baseUrl}/browse/latest/film/1`;
    }
    if (req.params.cat === "series") {
      url = `${baseUrl}/browse/latest/series/1`;
    }
    if (req.params.cat === "music") {
      url = `${baseUrl}/browse/latest/music/1`;
    }


    const { body } = await gotScraping(url);
    const $ = cheerio.load(body);

    let results = {};

    $("table tr").each((i, tr) => {
      const td = $(tr).find("td.a1 a");
      const authorLink = $(tr).find("td.a5 a");

      if (td.length > 0) {
        let language = td.find("span.l.r.neutral-icon , .l.r.positive-icon, .l.r.bad-icon").text().trim() || null;
        let filmTitle = td.find(".new").text().trim() || null;
        let path = td.attr("href") || null;
        let type = $(tr).find("td.a3").text().trim() || null;
        let uploaded = $(tr).find("td.a6").text().trim() || null;
        let downloads = $(tr).find("td.a7").text().trim() || null;
        let author = authorLink.text().trim() || null;
        let authorProfile = baseUrl + authorLink.attr("href") || null;

        // console.log(language);

        if (language !== "") {
          if (!results[language]) {
            results[language] = [];
          }
          results[language].push({ path, filmTitle, type, uploaded, downloads, author, authorProfile});
        }
      }
    });

    cleanUpResults(results);

    return res.json(results);

  } catch (err) {
    console.log(err);
    res.status(500).json("Error while fetching data");
  }
});

module.exports = router;

function cleanUpResults(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(/[\n\t]/g, "");
    } else if (typeof obj[key] === "object") {
      cleanUpResults(obj[key]);
    }
  }
}