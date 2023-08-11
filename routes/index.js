const cheerio = require("cheerio");
const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

router.get("/", async (req, res) => {
  try {
    const homeData = {
      search: "/search?q=[YOUR_QUERY_HERE]",
      getSub: "/subtitles/[PATH]",
      dlSub: "/subtitles/[PATH]/[LANGUAGE]/[ID]/[NAME]",
      popular: "/popular",
      latest: "/latest",
    };

    // Clean up the results to remove \n and \t
    cleanUpResults(homeData);

    return res.json(homeData);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error while fetching data");
  }
});

function cleanUpResults(obj) {
  for (const key in obj) {
    if (typeof obj[key] === "string") {
      obj[key] = obj[key].replace(/[\n\t]/g, "");
    } else if (typeof obj[key] === "object") {
      cleanUpResults(obj[key]);
    }
  }
}

module.exports = router;
