const cheerio = require("cheerio");
const axios = require("axios");
const { gotScraping } = require("got-scraping");

let express = require("express");
let router = express.Router();

const baseUrl = "https://subscene.com";

router.get("/", async (req, res) => {
  try {
    const { body } = await gotScraping(baseUrl);
    const $ = cheerio.load(body);

    let results = [];

    $(".popular-films h1").each((i, h1) => {
      let data = [];

      const ulName = $(h1).text().trim();
      const ul = $(h1).next(".box").find(".details");

      ul.children("li").each((j, li) => {
        let path = $(li).find("a").attr("href");
        let poster = $(li).find("img").attr("src");
        let subtitles = [];

        $(li)
          .find("ul")
          .children("li")
          .each((k, li) => {
            let title = $(li).find(".title > a:first-child").text().trim();
            let name = $(li).find(".name span").text().trim();
            let url = $(li).find(".name a").attr("href");
            if (name.length > 0) {
              let subtitleObj = {
                name: name,
                url: url,
              };
              subtitles.push(subtitleObj);
            }
            if (title.length > 0) {
              data.push({
                title: title,
                path: path,
                poster: poster,
                subtitles: subtitles,
              });
            }
          });
      });
      let section = {
        section: ulName,
        data: data,
      };
      results.push(section);
    });

    let recentSubtitles = [];

    let recentUlName = $("div.recent-subtitles h2").text().trim();
    let recentUl = $("div.recent-subtitles h2").next("ul");

    recentUl.find("li").each((j, li) => {
      let url = $(li).find(".name a").attr("href");
      let lan = $(li).find(".name a span").text().trim();
      let name = $(li)
        .find(".name a")
        .text()
        .trim()
        .split(lan)
        .map((part) => part.trim())
        .join("");

      if (name.length > 0) {
        let subtitleObj = {
          name: name,
          url: url,
          lan: lan,
        };
        recentSubtitles.push(subtitleObj);
      }
    });
    results.push({
      section: recentUlName,
      data: recentSubtitles,
    });

    cleanUpResults(results);
    return res.json(results);
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
