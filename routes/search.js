const cheerio = require("cheerio");
const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com";

router.get("/search", async (req, res) => {
  const query = req.query.q;
  try {
    if (!query.length) {
      throw new Error("Query Is Empty");
    }
    const url = `${baseUrl}/subtitles/searchbytitle?query=${query}`;
    const { body } = await gotScraping(url);
    const $ = cheerio.load(body);

    const results = [];

    $(".byTitle .search-result h2").each((i, h2) => {
      let data = [];

      const ulName = $(h2).text().trim();
      const ul = $(h2).next("ul");

      ul.find("li").each((j, li) => {
        const titleDiv = $(li).find(".title");
        const path = titleDiv.find("a").attr("href");
        const title = titleDiv.find("a").text().trim();
        const count = $(li).find(".subtle.count").text().trim();
        data.push({ path, title, count });
      });

      if (data.length === 0) {
        delete data;
      }
      results.push({ section: ulName, data });

      if (data.length === 0) {
        return res.json({
          data:
            "It looks like there aren't many great matches for your search",
        });
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
