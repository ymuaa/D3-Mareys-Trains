var stations = []; // lazily loaded

var formatTime = d3.time.format("%I:%M%p");

var margin = {top: 20, right: 30, bottom: 20, left: 200},
    width = 1200 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.time.scale()
    .domain([parseTime("5:30AM"), parseTime("11:30AM")])
    .range([0, width]);

var y = d3.scale.linear()
    .range([0, height]);

var xAxis = d3.svg.axis()
    .scale(x)
    .ticks(8)
    .tickFormat(formatTime);

var line = d3.svg.line()
    .x(function(d) { return x(d.time); })
    .y(function(d) { return y(d.station.distance); });

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

svg.append("defs").append("clipPath")
    .attr("id", "clip")
  .append("rect")
    .attr("y", -margin.top)
    .attr("width", width)
    .attr("height", height + margin.top + margin.bottom);

d3.tsv("schedule.tsv", type, function(error, trains) {
  y.domain(d3.extent(stations, function(d) { return d.distance; }));

  var station = svg.append("g")
      .attr("class", "station")
    .selectAll("g")
      .data(stations)
    .enter().append("g")
      .attr("transform", function(d) { return "translate(0," + y(d.distance) + ")"; });

  station.append("text")
      .attr("x", -6)
      .attr("dy", ".35em")
      .text(function(d) { return d.name; });

  station.append("line")
      .attr("x2", width);

  svg.append("g")
      .attr("class", "x top axis")
      .call(xAxis.orient("top"));

  svg.append("g")
      .attr("class", "x bottom axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxis.orient("bottom"));

  var train = svg.append("g")
      .attr("class", "train")
      .attr("clip-path", "url(#clip)")
    .selectAll("g")
      .data(trains.filter(function(d) { return /[NLB]/.test(d.type); }))
    .enter().append("g")
      .attr("class", function(d) { return d.type; });

  train.append("path")
      .attr("d", function(d) { return line(d.stops); });

  train.selectAll("circle")
      .data(function(d) { return d.stops; })
    .enter().append("circle")
      .attr("transform", function(d) { return "translate(" + x(d.time) + "," + y(d.station.distance) + ")"; })
      .attr("r", 2);
});

function type(d, i) {

  // Extract the stations from the "stop|*" columns.
  if (!i) for (var k in d) {
    if (/^stop\|/.test(k)) {
      var p = k.split("|");
      stations.push({
        key: k,
        name: p[1],
        distance: +p[2],
        zone: +p[3]
      });
    }
  }

  return {
    number: d.number,
    type: d.type,
    direction: d.direction,
    stops: stations
        .map(function(s) { return {station: s, time: parseTime(d[s.key])}; })
        .filter(function(s) { return s.time != null; })
  };
}

function parseTime(s) {
  var t = formatTime.parse(s);
  if (t != null && t.getHours() < 3) t.setDate(t.getDate() + 1);
  return t;
}
