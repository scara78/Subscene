const cheerio = require("cheerio");
const axios = require("axios");
const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com";

router.get("/subtitles/:path", async (req, res) => {
  const path = req.params.path;
  try {
    if (!path.length) {
      throw new Error("Path Is Empty");
    }
    const url = `${baseUrl}/subtitles/${path}`;
    const { body } = await gotScraping(url);
    const $ = cheerio.load(body);

    let results = {};

    let title =
      $(".top.left .header h2")
        .contents()
        .filter(function () {
          return this.nodeType === 3;
        })
        .text()
        .trim() || null;

    let year =
      $(".top.left .header ul li:first-child")
        .text()
        .replace("Year:", "")
        .trim() || null;

    let poster = null;
    const posterDiv = $(".top.left .poster");
    const imgTag = posterDiv.find("img");
    if (imgTag.length > 0) {
      poster = imgTag.attr("src");
    }

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

    results["title"] = title;
    results["poster"] = poster;
    results["imdbInfo"] = imdbInfo;

    let subtitles = [];

    $("tr:not(:first-child)").each((i, tr) => {
      const td = $(tr).find("td.a1 a");
      const authorLink = $(tr).find("td.a5 a");
      const comment = $(tr).find("td.a6 div").text().trim() || null;

      if (td.length > 0) {
        let lan =
          td
            .find("span.l.r.neutral-icon, .l.r.positive-icon, .l.r.bad-icon")
            .text()
            .trim() || null;
        let filmTitle =
          td
            .find(
              "span:not(.l.r.positive-icon), span:not(.l.r.neutral-icon), span:not(.l.r.bad-icon)"
            )
            .text()
            .replace(lan, "")
            .trim() || null;
        let path = td.attr("href") || null;
        let author = authorLink.text().trim() || null;
        let authorProfile = baseUrl + authorLink.attr("href") || null;

        if (lan !== "") {
          let subtitle = {
            lan,
            path,
            filmTitle,
            author,
            authorProfile,
            comment,
          };
          subtitles.push(subtitle);
        }
      }
    });

    results["subtitles"] = subtitles;

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
