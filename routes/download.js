const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com";
const brandName = "SubtitleZ.com";

router.get("/download/subtitles/:lan/:id/:name", async (req, res) => {
  try {
    let downloadUrl =
      baseUrl + "/subtitles/" + req.params.lan + "/" + req.params.id;
    let file = await gotScraping.get(downloadUrl, {
      responseType: "buffer",
    });

    if (!file || !file.body) throw "File Downloading Error";

    const name = req.params.name
      ? brandName + " - " + decodeURIComponent(req.params.name) + ".zip"
      : brandName + "_Subtitle.zip";
    const buffer = file.body;

    res.setHeader("Content-Disposition", `attachment; filename=${name}`);
    res.setHeader("Content-Type", "application/zip");

    res.send(buffer);
  } catch (err) {
    console.log(err);
    res.status(500).json("Error while fetching data");
  }
});

module.exports = router;
