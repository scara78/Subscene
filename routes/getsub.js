const cheerio = require("cheerio");
const { gotScraping } = require('got-scraping');

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com"

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

    let title = $(".top.left .header h2").contents()
      .filter(function () {
        return this.nodeType === 3;
      })
      .text()
      .trim() || null;

    let year = $(".top.left .header ul li:first-child").text().replace("Year:", "").trim() || null;

    let poster = null;
    const posterDiv = $(".top.left .poster");
    const imgTag = posterDiv.find("img");
    if (imgTag.length > 0) {
      poster = imgTag.attr("src");
    }

    let imdb = $("a.imdb").attr("href") || null;

    info = { title, year, poster, imdb };
    results["info"] = info;

    let subtitles = {};

    $("tr:not(:first-child)").each((i, tr) => {
      const td = $(tr).find("td.a1 a");
      const authorLink = $(tr).find("td.a5 a");
      const comment = $(tr).find("td.a6 div").text().trim() || null;

      if (td.length > 0) {
        let language = td.find("span.l.r.positive-icon").text().trim() || null;
        let filmTitle = td.find("span:not(.l.r.positive-icon)").text().trim() || null;
        let path = td.attr("href") || null;
        let author = authorLink.text().trim() || null;
        let authorProfile = baseUrl + authorLink.attr("href") || null;

        if (language !== "") {
          if (!subtitles[language]) {
            subtitles[language] = [];
          }
          subtitles[language].push({ path, filmTitle, author, authorProfile, comment });
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