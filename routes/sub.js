const cheerio = require("cheerio");
const axios = require("axios");
const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com";

router.get("/subtitles/:path/:lan/:id", async (req, res) => {
  try {
    if (
      !req.params.path.length ||
      !req.params.lan.length ||
      !req.params.id.length
    ) {
      throw new Error("Wrong Parameters");
    }
    const url = `${baseUrl}/subtitles/${req.params.path}/${req.params.lan}/${req.params.id}`;
    const { body } = await gotScraping(url);
    const $ = cheerio.load(body);

    let results = {};

    let title = $("span[itemprop='name']").text().trim() || null;
    let poster = null;
    const posterDiv = $(".top.left .poster");
    const imgTag = posterDiv.find("img");
    if (imgTag.length > 0) {
      poster = imgTag.attr("src");
    }
    let author = $(".author a").text().trim() || null;
    let subtitlesDetails = [];

    $("#details > ul > li").each((i, li) => {
      const text = $(li).text().trim();

      if (text === "---------------------------------------") {
        return;
      }

      const parts = text.split(":");
      if (parts.length === 2) {
        let key = parts[0].trim();
        let value = parts[1].trim();

        if (key === "Rated") {
          value = value.split("/")[0].trim();
        }

        subtitlesDetails.push({
          name: key,
          value: value,
        });
      }
    });

    // let download = $(".download a").attr("href") || null;

    let imdb = $("a.imdb").attr("href") || null;
    let imdbId = null;

    if (imdb && imdb.includes("/title/tt")) {
      const parts = imdb.split("/");
      imdbId = parts[parts.length - 1];
    }

    let imdbData = null;

    if (imdbId) {
      imdbData = await axios.get(
        `https://imdb.bymirrorx.eu.org/title/${imdbId}`
      );

      const posterUrl = imdbData.data.image || null;

      const modifiedPosterUrl = posterUrl
        ? posterUrl.replace(/\.jpg$/, "FMjpg_UX1000_.jpg")
        : null;

      imdbInfo = {
        imdb: imdb,
        description: imdbData.data.plot || null,
        poster: modifiedPosterUrl,
        type: imdbData.data.contentType || null,
        rating: imdbData.data.rating || null,
        contentRating: imdbData.data.contentRating || null,
        runtime: imdbData.data.runtime || null,
        released: imdbData.data.releaseDetailed || null,
        genres: imdbData.data.genre || null,
        top_credits: imdbData.data.top_credits || null,
        images: imdbData.data.images || null,
      };
    } else {
      imdbInfo = null;
    }

    let releaseInfo = {};
    $("li.release div").each((i, div) => {
      releaseInfo[`${i + 1}`] = $(div).text().trim();
    });

    let download =
      "/download" +
        $(".download a").attr("href") +
        "/" +
        encodeURIComponent(releaseInfo[1].replace(/[^\w\s]/gi, "_")) || null;
    if (!download) {
      throw "Unexpected Error";
    }

    results["releaseInfo"] = releaseInfo;

    results = {
      title,
      poster,
      author,
      subtitlesDetails,
      download,
      imdbInfo,
      releaseInfo,
    };
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
