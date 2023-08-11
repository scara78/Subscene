const cheerio = require("cheerio");
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
    let author = $(".author a").text().trim() || null;
    let type =
      $("#details ul li:nth-child(7)")
        .text()
        .replace("Release type:", "")
        .trim() || null;
    let files =
      $("#details ul li:nth-child(5)").text().replace("Files:", "").trim() ||
      null;
    let downloads =
      $("#details ul li:last-child").text().replace("Downloads:", "").trim() ||
      null;
    let uploadedAt =
      $("#details ul li:first-child").text().replace("Online:", "").trim() ||
      null;
    // let download = $(".download a").attr("href") || null;

    let releaseInfo = {};
    $("li.release div").each((i, div) => {
      releaseInfo[`${i + 1}`] = $(div).text().trim();
    });

    let download =
      "/download" +
        $(".download a").attr("href") +
        "/" +
        encodeURIComponent(releaseInfo[1]) || null;
    if (!download) {
      throw "Unexpected Error";
    }

    results["releaseInfo"] = releaseInfo;

    results = {
      title,
      author,
      type,
      files,
      downloads,
      uploadedAt,
      download,
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
