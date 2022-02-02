const WIDTH = document.getElementById("map-container").clientWidth;
const HEIGHT = WIDTH * 0.75;

const margin = { top: 50, bottom: 0, left: 50, right: 50 };

const width = WIDTH - margin.left - margin.right,
  height = HEIGHT - margin.top - margin.bottom;

const svg = d3
  .select("svg#map-svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT);

const map = svg
  .append("g")
  .attr("id", "geo-container")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);

const title = svg
  .append("text")
  .attr("id", "title")
  .attr("transform", `translate(${margin.left + width / 2}, ${margin.top / 2})`)
  .attr("dy", "0.5em")
  .style("text-anchor", "middle")
  .text("Restaurants UberEats Santiago");

const stgoGroup = map.append("g").attr("id", "stgo");
const streetsGroup = map.append("g").attr("id", "streets");
const restaurantsGroup = map.append("g").attr("id", "restaurants");

const boundingRect = map
  .append("rect")
  .attr("id", "boudaries")
  .attr("width", width)
  .attr("height", height)
  .attr("fill", "none")
  .attr("stroke", "black");

const clipPath = map
  .append("clipPath")
  .attr("id", "mapClip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

map.attr("clip-path", "url(#mapClip)");

const categorieSelect = document.getElementById("categorie-select");
const ratingSlider = document.getElementById("rating-input");
const rangeValue = document.getElementById("range-value");

const priceButton1 = document.getElementById("price-button-1");
priceButton1.style.opacity = 0.7;
const priceButton2 = document.getElementById("price-button-2");
priceButton2.style.opacity = 0.7;
const priceButton3 = document.getElementById("price-button-3");
priceButton3.style.opacity = 0.7;

getCategories = (restaurants) => {
  categories = {};
  restaurants.forEach((restaurant) => {
    restaurant.categories.forEach((categorie) => {
      categories[categorie] = (categories[categorie] || 0) + 1;
    });
  });
  categoriesFinal = new Set();
  for (let categorie in categories) {
    if (categories[categorie] >= 10) {
      categoriesFinal.add(categorie);
    }
  }
  return Array.from(categoriesFinal).sort(function (a, b) {
    return a.toLowerCase().localeCompare(b.toLowerCase());
  });
};

getComuna = (comuna) => {
  const comunas = {
    lagranja: "LaGranja",
    macul: "Macul",
    penalolen: "Peñalolén",
    pac: "PedroAguirreCerda",
    sanmiguel: "SanMiguel",
    sanjoaquin: "SanJoaquín",
    estacioncentral: "EstaciónCentral",
    loespejo: "LoEspejo",
    santiago: "Santiago",
    maipu: "Maipú",
    lacisterna: "LaCisterna",
    lareina: "LaReina",
    independencia: "Independencia",
    recoleta: "Recoleta",
    providencia: "Providencia",
    laflorida: "LaFlorida",
    quintanormal: "QuintaNormal",
    renca: "Renca",
    loprado: "LoPrado",
    pudahuel: "Pudahuel",
    lascondes: "LasCondes",
    vitacura: "Vitacura",
    elbosque: "ElBosque",
    lobarnechea: "LoBarnechea",
    cerronavia: "CerroNavia",
    sanramon: "SanRamón",
    cerrillos: "Cerrillos",
    colina: "Colina",
    conchali: "Conchalí",
    quilicura: "Quilicura",
    huechuraba: "Huechuraba",
    lapintana: "LaPintana",
    lampa: "Lampa",
    sanbernardo: "SanBernardo",
    nunoa: "Ñuñoa",
    puentealto: "PuenteAlto",
  };

  let normalizedComuna = comuna
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w]/g, "");
  return comunas[normalizedComuna];
};

async function initialLoad() {
  const comunasStgo = await d3.json("./src/data/comunas.geojson");
  const streetsStgo = await d3.json("./src/data/streets_stgo.geojson");
  const uberRestaurants = await d3.json("./src/data/uber_restaurants2.json");

  const categories = getCategories(uberRestaurants);
  categories.forEach((categorie) => {
    let opt = document.createElement("option");
    opt.value = categorie;
    opt.innerHTML = categorie;
    categorieSelect.appendChild(opt);
  });

  return { comunasStgo, streetsStgo, uberRestaurants };
}

const zoomHandler = (evento) => {
  const transformacion = evento.transform;

  stgoGroup.selectAll("path").attr("transform", transformacion);

  streetsGroup.selectAll("path").attr("transform", transformacion);

  restaurantsGroup.selectAll("circle").attr("transform", transformacion);
};

const zoom = d3
  .zoom()
  .extent([
    [0, 0],
    [width, height],
  ])
  .translateExtent([
    [0, 0],
    [width, height],
  ])
  .scaleExtent([1, 4])
  .on("zoom", zoomHandler);

svg.call(zoom);

const tooltip = d3
  .select("#map-container")
  .append("div")
  .style("opacity", 0)
  .attr("class", "tooltip");

const mouseover = function (e, d) {
  tooltip.style("opacity", 1);
};

const mousemove = function (e, d) {
  tooltip
    .html(d.name + "<div>" + d.rating + "&#11088; " + d.priceRange + "</div>")
    .style("left", e.x + 20 + "px")
    .style("top", e.y + "px");
};

const mouseleave = function (e, d) {
  tooltip.transition().duration(200).style("opacity", 0);
};

const proyeccion = d3.geoMercator();

const escalaRadio = function (value) {
  return (value - 1) * 0.7;
};

const priceColors = {
  $$$: "#A72529",
  $$: "#D3363B",
  $: "#DE686C",
  "": "#18392D",
};
const escalaColor = function (value) {
  return priceColors[value];
};

const addPriceLegend = function () {
  let yLegend = 0;
  for (let key in priceColors) {
    yLegend += 20;
    svg
      .append("text")
      .attr("x", margin.left + 30)
      .attr("y", margin.top + yLegend)
      .text(() => {
        if (key == "") {
          return "null";
        } else {
          return key;
        }
      })
      .style("fill", "white")
      .style("font-size", "14px")
      .attr("alignment-baseline", "middle");
    svg
      .append("circle")
      .attr("cx", margin.left + 15)
      .attr("cy", margin.top + yLegend)
      .attr("r", 5)
      .style("vertical-align", "middle")
      .style("fill", priceColors[key]);
  }
};

const addRatingLegend = function () {
  const ratings = [2, 3, 4, 5];

  let yLegend = -55;
  for (i in ratings) {
    let rating = ratings[i];
    yLegend += 27;
    svg
      .append("text")
      .attr("x", margin.left + 35)
      .attr("y", height - margin.bottom - yLegend)
      .text(rating + " ⭐")
      .style("fill", "white")
      .style("font-size", "14px")
      .attr("alignment-baseline", "middle");
    svg
      .append("circle")
      .attr("cx", margin.left + 15)
      .attr("cy", height - margin.bottom - yLegend)
      .attr("r", escalaRadio(rating) * 3.5)
      .style("vertical-align", "middle")
      .style("fill", "#DE686C");
  }
};

initialLoad().then(({ comunasStgo, streetsStgo, uberRestaurants }) => {
  proyeccion.fitSize([width, height], comunasStgo);
  const caminosGeo = d3.geoPath().projection(proyeccion);

  stgoGroup
    .selectAll("path")
    .data(comunasStgo.features)
    .enter()
    .append("path")
    .style("fill", "#7EC9B0")
    .style("stroke", "ivory")
    .style("stroke-width", 1.8)
    .attr("class", "stgo")
    .attr("id", (d) => getComuna(d.properties.COMUNA))
    .attr("d", caminosGeo)
    .attr("opacity", "0.5");

  streetsGroup
    .selectAll("path")
    .data(streetsStgo.features)
    .enter()
    .append("path")
    .style("fill", "none")
    .style("stroke", "#EE9B00")
    .style("stroke-width", 1)
    .attr("class", "streets")
    .attr("d", caminosGeo)
    .attr("opacity", "1");

  restaurantsGroup
    .selectAll("circle")
    .data(uberRestaurants)
    .join("circle")
    .attr("id", (d) => d.name)
    .attr("cx", (d) => proyeccion([d.longitude, d.latitude])[0])
    .attr("cy", (d) => proyeccion([d.longitude, d.latitude])[1])
    .attr("r", (d) => escalaRadio(d.rating))
    .attr("fill", (d) => escalaColor(d.priceRange))
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", clickRestaurant);

  // addRatingLegend();
  // addPriceLegend();
});

filterDeliveries = async (deliveryId) => {
  const uberDeliveries = await d3.json("./src/data/uber_deliveries2.json");
  return uberDeliveries.filter(function (d) {
    return d.deliveryId === deliveryId;
  });
};

filterData = async (
  priceRange1,
  priceRange2,
  priceRange3,
  categorie,
  rating
) => {
  const uberRestaurants = await d3.json("./src/data/uber_restaurants2.json");
  return uberRestaurants.filter(function (d) {
    qualifies = true;
    if (priceRange1 && priceRange2 && priceRange3) {
      if (
        !(d.priceRange == "$" || d.priceRange == "$$" || d.priceRange == "$$$")
      ) {
        qualifies = false;
      }
    } else if (priceRange1 && priceRange2) {
      if (!(d.priceRange == "$" || d.priceRange == "$$")) {
        qualifies = false;
      }
    } else if (priceRange1 && priceRange3) {
      if (!(d.priceRange == "$" || d.priceRange == "$$$")) {
        qualifies = false;
      }
    } else if (priceRange2 && priceRange3) {
      if (!(d.priceRange == "$$" || d.priceRange == "$$$")) {
        qualifies = false;
      }
    } else if (priceRange1) {
      if (!(d.priceRange == "$")) {
        qualifies = false;
      }
    } else if (priceRange2) {
      if (!(d.priceRange == "$$")) {
        qualifies = false;
      }
    } else if (priceRange3) {
      if (!(d.priceRange == "$$$")) {
        qualifies = false;
      }
    }
    if (
      qualifies &&
      categorie != "Categoría..." &&
      categorie != "Todas las categorías"
    ) {
      if (!d.categories.includes(categorie)) {
        qualifies = false;
      }
    }
    if (qualifies) {
      if (parseFloat(d.rating) < rating) {
        qualifies = false;
      }
    }
    return qualifies;
  });
};

updateRestaurants = async () => {
  const priceRange1 = priceButton1.classList.contains("selected");
  const priceRange2 = priceButton2.classList.contains("selected");
  const priceRange3 = priceButton3.classList.contains("selected");
  const categorie = categorieSelect.value;
  const rating = parseFloat(rangeValue.innerHTML);

  const newData = await filterData(
    priceRange1,
    priceRange2,
    priceRange3,
    categorie,
    rating
  );

  restaurantsGroup.selectAll("circle").remove();
  svg
    .transition()
    .duration(400)
    .call(zoom.transform, d3.zoomIdentity.translate(0, 0));
  restaurantsGroup
    .selectAll("circle")
    .data(newData)
    .join("circle")
    .attr("id", (d) => d.name)
    .attr("cx", (d) => proyeccion([d.longitude, d.latitude])[0])
    .attr("cy", (d) => proyeccion([d.longitude, d.latitude])[1])
    .attr("r", (d) => escalaRadio(d.rating))
    .attr("fill", (d) => escalaColor(d.priceRange))
    .style("opacity", 0)
    .on("mouseover", mouseover)
    .on("mousemove", mousemove)
    .on("mouseleave", mouseleave)
    .on("click", clickRestaurant)
    .transition()
    .duration(400)
    .style("opacity", 1);
};

categorieSelect.onchange = async () => {
  await updateRestaurants();
};

priceButton1.onclick = async () => {
  if (priceButton1.style.opacity == 0.7) {
    priceButton1.style.opacity = 1;
    priceButton1.classList.add("selected");
    await updateRestaurants();
  } else {
    priceButton1.style.opacity = 0.7;
    priceButton1.classList.remove("selected");
    await updateRestaurants();
  }
};

priceButton2.onclick = async () => {
  if (priceButton2.style.opacity == 0.7) {
    priceButton2.style.opacity = 1;
    priceButton2.classList.add("selected");
    await updateRestaurants();
  } else {
    priceButton2.style.opacity = 0.7;
    priceButton2.classList.remove("selected");
    await updateRestaurants();
  }
};

priceButton3.onclick = async () => {
  if (priceButton3.style.opacity == 0.7) {
    priceButton3.style.opacity = 1;
    priceButton3.classList.add("selected");
    await updateRestaurants();
  } else {
    priceButton3.style.opacity = 0.7;
    priceButton3.classList.remove("selected");
    await updateRestaurants();
  }
};

ratingSlider.addEventListener("change", async function () {
  rangeValue.innerHTML =
    Math.round(Math.abs(6 - ratingSlider.value) * 10) / 10 + " ⭐";
  await updateRestaurants();
});

const showDeliveries = function (deliveries) {
  const deliveriesTitle = document.getElementById("deliveries-title");
  deliveriesTitle.style.visibility = "visible";

  const deliveriesDiv = document.getElementById("deliveries");
  deliveriesDiv.innerHTML = "";

  const prices = {};
  const times = {};
  deliveries.forEach((delivery) => {
    let comuna = delivery.address
      .split(", Región Metropolitana")[0]
      .split(",")
      .at(-1);
    if (!prices[comuna]) {
      prices[comuna] = [delivery.delivery_fee];
      times[comuna] = delivery.delivery_time;
    } else {
      prices[comuna].push(delivery.delivery_fee);
    }
  });

  for (let [key, value] of Object.entries(prices)) {
    let p = document.createElement("p");
    let b = document.createElement("b");
    b.innerHTML = key;
    b.classList.add("comuna-delivery");
    p.appendChild(b);
    p.innerHTML = p.innerHTML + ": $" + d3.mean(value) + " / " + times[key];
    deliveriesDiv.appendChild(p);
  }
};

const clickRestaurant = async (e, d) => {
  stgoGroup
    .selectAll("path")
    .transition()
    .duration(100)
    .style("fill", "#7EC9B0");

  const deliveries = await filterDeliveries(d.restaurantId);

  let comunas = new Set();
  deliveries.forEach((delivery) => {
    let comuna =
      "#" +
      delivery.address
        .split(", Región Metropolitana")[0]
        .split(",")
        .at(-1)
        .replaceAll(" ", "");
    comunas.add(comuna);
  });
  comunas = Array.from(comunas);

  comunas.forEach((comuna) => {
    d3.select(comuna).transition().duration(200).style("fill", "gold");
  });
  showDeliveries(deliveries);
};
