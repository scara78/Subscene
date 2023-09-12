const cheerio = require("cheerio");
const axios = require("axios");
const {
  gotScraping
} = require("got-scraping");

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
    const {
      body
    } = await gotScraping(url);
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
    const parts = imdb.split('/');
    const imdbId = parts[parts.length - 1];

    let imdbData = await axios.get(`https://imdb.bymirrorx.eu.org/title/${imdbId}`);

    let imdbInfo = {
      imdb: imdb,
      description: imdbData.data.plot,
      poster: imdbData.data.image,
      type: imdbData.data.contentType,
      rating: imdbData.data.rating,
      contentRating: imdbData.data.contentRating,
      runtime: imdbData.data.runtime,
      released: imdbData.data.releaseDetailed,
      genres: imdbData.data.genre,
      top_credits: imdbData.data.top_credits,
      images: imdbData.data.images
    };

    // if (imdb) {
    //   const imdbPage = await gotScraping(imdb);
    //   const imdbHtml = imdbPage.body;
    //   const imdb$ = cheerio.load(imdbHtml);

    //   const imdbDescription =
    //     imdb$("p[data-testid='plot'] span:first-child").text().trim() || null;
    //   const imdbRating =
    //     imdb$("div[data-testid='hero-rating-bar__aggregate-rating__score']")
    //       .first()
    //       .text()
    //       .split("/")[0]
    //       .trim() || null;
    //   const imdbRuntime =
    //     imdb$("div h1[data-testid='hero__pageTitle']")
    //       .closest("div")
    //       .find("ul li:last-child")
    //       .first()
    //       .text()
    //       .trim() || null;
    //   const imdbGenres = [];
    //   imdb$("div[data-testid='genres'] div:nth-child(2) a span").each(
    //     (i, span) => {
    //       imdbGenres.push(imdb$(span).text().trim());
    //     }
    //   );
    //   const imdbGenresString = imdbGenres.join(", ").toString();
    //   const imdbDirector =
    //     imdb$(
    //       "ul.ipc-metadata-list.ipc-metadata-list--dividers-all.title-pc-list.ipc-metadata-list--baseAlt li:nth-child(1) div ul li:first-child a"
    //     )
    //       .first()
    //       .text()
    //       .trim() || null;
    //   const imdbCasts = [];
    //   imdb$(
    //     "ul.ipc-metadata-list.ipc-metadata-list--dividers-all.title-pc-list.ipc-metadata-list--baseAlt li:last-child div ul li"
    //   ).each((i, li) => {
    //     imdbCasts.push(imdb$(li).text().trim());
    //   });
    //   const imdbCastsString = imdbCasts.join(", ").toString();

    //   imdbInfo = {
    //     description: imdbDescription,
    //     rating: imdbRating,
    //     runtime: imdbRuntime,
    //     genres: imdbGenresString,
    //     director: imdbDirector,
    //     casts: imdbCastsString,
    //   };
    // }

    info = {
      title,
      imdbInfo,
    };
    results["info"] = info;

    let subtitles = {};

    $("tr:not(:first-child)").each((i, tr) => {
      const td = $(tr).find("td.a1 a");
      const authorLink = $(tr).find("td.a5 a");
      const comment = $(tr).find("td.a6 div").text().trim() || null;

      if (td.length > 0) {
        let language =
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
          .replace(language, "")
          .trim() || null;
        let path = td.attr("href") || null;
        let author = authorLink.text().trim() || null;
        let authorProfile = baseUrl + authorLink.attr("href") || null;

        if (language !== "") {
          if (!subtitles[language]) {
            subtitles[language] = [];
          }
          subtitles[language].push({
            path,
            filmTitle,
            author,
            authorProfile,
            comment,
          });
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