var margin = {top: 200, right: 200, bottom: 200, left: 200}
  , width = window.innerWidth - margin.left - margin.right // Use the window"s width 
  , height = window.innerHeight - margin.top - margin.bottom; // Use the window"s height
var data;

d3.csv("https://raw.githubusercontent.com/wcota/covid19br/master/cases-brazil-cities-time.csv", d3.autoType)
	.then(function(_data) {
		data = _data
		draw("total", "total")

		// Add cities to selector
		cities = []
		for (var i in data) {
			if ((data[i].city != "TOTAL") && (!cities.includes(data[i].city))) {
				cities.push(data[i].city)
			}
		}
		cities = cities.sort()
		for (var i=0; i < cities.length; i++) {
			city = cities[i]
			var o = new Option(city, city);
			$(o).html(city);
			$("#city").append(o);
		}
	})

function add_days(date, days) {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function with_separator(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function draw(_state, _city) {

	$("svg").remove()

	var result = [];
	var o = {};

	for (var i=0; i < data.length; i++) {
		line = data[i];
		if (line.city == "TOTAL") continue;
		if ((_state == "total") || (line.state == _state)) {
			if ((_city == "total") || (line.city == _city)) {
				if (!o[line.date]) {
					o[line.date] = line.totalCases
				} else {
					o[line.date] += line.totalCases
				}
			}
		}
		
	}
	for (var date in o) {
		result.push({date: new Date(date), qty_cases: o[date]});	
	}

	first_date = result[0]["date"]
	for (var i = 0; i < us.length; i++) {
		us[i]["date"] = add_days(first_date, us[i].timelapse)
	}

	for (var i = 0; i < italy.length; i++) {
		italy[i]["date"] = add_days(first_date, italy[i].timelapse)
	}

	for (var i = 0; i < spain.length; i++) {
		spain[i]["date"] = add_days(first_date, spain[i].timelapse)
	}
	

	var xScale = d3.scaleTime()
	    .domain([first_date, us[us.length-1]["date"]]) // input
	    .range([0, width]); // output

	// 6. Y scale will use the randomly generate number 
	var yScale = d3.scaleLinear()
	    .domain([0, us[us.length-1]["qty_cases"] * 1.1]) // input 
	    .range([height, 0]); // output 

	// 7. d3"s line generator
	var line = d3.line()
	    .x(function(d) { return xScale(d.date); }) // set the x values for the line generator
	    .y(function(d) { return yScale(d.qty_cases); }) // set the y values for the line generator 
	    .curve(d3.curveMonotoneX) // apply smoothing to the line

	var svg = d3
		.select("body")
		.append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	  	.append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	// 3. Call the x axis in a group tag
	svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(d3.axisBottom(xScale)); // Create an axis component with d3.axisBottom

	// 4. Call the y axis in a group tag
	svg.append("g")
	    .attr("class", "y axis")
	    .call(d3.axisLeft(yScale)); // Create an axis component with d3.axisLeft

	// Axis titles
	svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+ (-margin.left/2) +","+(height/2)+")rotate(-90)")
        .text("# casos confirmados");

    svg.append("text")
        .attr("text-anchor", "middle")
        .attr("transform", "translate("+ (width/2) +","+(height+(margin.bottom/4))+")")
        .text("Data para Brasil - Tempo depois do 1º caso para outros países");

	var tooltip = d3.select("body")
	    .append("div")
	    .attr("class", "tooltip")
	    .text("a simple tooltip");

	var keys = [
		{name: "Brasil", color: "#efce13", data: result, class: "br"},
		{name: "EUA", color: "#377eb8", data: us, class: "us"},
		{name: "Italia", color: "#4daf4a", data: italy, class: "it"},
		{name: "Espanha", color: "#e41a1c", data: spain, class: "es"},
		]

	for (var i = 0; i < keys.length; i++) {
		svg.append("path")
		    .datum(keys[i].data) // 10. Binds data to the line 
		    .attr("class", "line " + keys[i].class) // Assign a class for styling 
		    .attr("d", line) // 11. Calls the line generator 

		svg.selectAll(".dot ." + keys[i].class + "-fill")
		    .data(keys[i].data)
		  	.enter()
		  	.append("svg:circle") // Uses the enter().append() method
		    .attr("class", "dot " + keys[i].class + "-fill") // Assign a class for styling
		    .attr("cx", function(d) { return xScale(d.date) })
		    .attr("cy", function(d) { return yScale(d.qty_cases) })
		    .attr("r", 5)
		    .on("mouseover", function(d) { return tooltip.style("visibility", "visible").text("# casos: " + with_separator(d.qty_cases));})
			.on("mousemove", function() { return tooltip.style("top",
			    (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
			.on("mouseout", function() { return tooltip.style("visibility", "hidden");});
	}

	// Legend
	var size = 20
	svg.selectAll("mydots")
	  .data(keys)
	  .enter()
	  .append("rect")
	    .attr("x", width/20)
	    .attr("y", function(d,i){ return 5 + i*(size+5)}) // 100 is where the first dot appears. 25 is the distance between dots
	    .attr("width", size)
	    .attr("height", 3)
	    .style("fill", function(d){ return d.color})

	// Add one dot in the legend for each name.
	svg.selectAll("mylabels")
	  .data(keys)
	  .enter()
	  .append("text")
	    .attr("x", width/20 + size*1.2)
	    .attr("y", function(d,i){ return i*(size+5) + (size/2)}) // 100 is where the first dot appears. 25 is the distance between dots
	    .style("fill", function(d){ return d.color})
	    .text(function(d){ return d.name})
	    .attr("text-anchor", "left")
	    .style("alignment-baseline", "middle")

}


$(".group-select").change(function() {
	selected_city = $("#city option:selected").val();
	selected_state = $("#state option:selected").val();
	draw(selected_state, selected_city)
});