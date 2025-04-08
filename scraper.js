// const axios = require("axios");
// const cheerio = require("cheerio");
const bcrypt = require('bcryptjs');

// const url = "https://carrentpokhara.com/car-listing/";

// async function scrapeCars() {
//   try {
//     const response = await axios.get(url);
//     const html = response.data;

//     const $ = cheerio.load(html);
//     const cars = [];

//     $(".ck-margin .row > div").each((index, element) => {
//       const carNameText = $(element).find(".ck-car-name .ck-first").text().trim();
//       const imagePath = $(element).find(".ck-image-wrap img").attr("src");

//       // Skip if no car name or image (to avoid layout junk)
//       if (!carNameText || !imagePath) return;

//       const carNameParts = carNameText.split(" ");
//       const brand = carNameParts[0] || "Unknown";
//       const model = carNameParts[1] || "Unknown";

//       const yearText = $(element).find(".ck-icon-collection .row > div:first-child").text().trim();
//       const year = yearText.split(" ")[1] || "N/A";

//       const priceText = $(element).find(".ck-price .ck-money p span").first().text().trim();
//       const pricePerDay = priceText.replace(/[^\d]/g, '') || "";

//       const carImage = imagePath.startsWith("http") ? imagePath : `https://carrentpokhara.com${imagePath}`;
//       const location = "Pokhara";

//       const car = { brand, model, year, location, pricePerDay, carImage };
//       cars.push(car);
//     });

//     console.log("✅ Total valid cars scraped:", cars.length);
//     console.log(cars);

//   } catch (err) {
//     console.error("Error scraping site:", err.message);
//   }
// }

// scrapeCars();

const hashPassword = '$2b$10$psKnL55dJDdVI7un6wTjlOo/kzge0T7EFC0C/l3P6ILjjJAFUwiDu';
