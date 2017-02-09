function createForce(data, activeSec) {
    d3.select(' #tagselector-canvas ').remove();

    let datasets    = _.chain(data).filter((o) => (_.size(o.d) > 0)).map('t');
    let nodeData    = datasets.flatMap().groupBy().map((val, key) => ({name : key, count : _.size(val)})).value();
    let linkData    = datasets.uniqWith(_.isEqual).flatMap((tags) => (_.reduce(tags, (result, value) => {
        let data    = [];
        if (_.size(result.tags) > 0) { _.forEach(result.tags, (o) => { data.push([o, value]); }); }
        return { data : _.concat((result['data'] || (result['data'] = [])), data), tags : _.concat(result['tags'] || (result['tags'] = []), value) };
    }, {}))['data']).uniqWith(_.isEqual).map((o) => ({ source : o[0], target : o[1], count : datasets.filter((d) => (_.intersection(o, d).length > 0)).size().value() })).value();

    let radiusrange = [15, 35];
    let linkrange   = [35, 15];
    let padding     = { top: 5, right: 15, bottom: 0, left: 15 };
    let width       = $(' #tagselector-container ').outerWidth(true) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) / 3) - padding.top - padding.bottom;

    $(' #tagselector-container ').width(width);
    $(' #tagselector-container ').height(height);
    $(' #tagselector-container ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let sizeScale   = d3.scaleLinear().domain([_.minBy(nodeData, 'count').count, _.maxBy(nodeData, 'count').count]).range(radiusrange);
    let lengthScale = d3.scaleLinear().domain([_.minBy(linkData, 'count').count, _.maxBy(linkData, 'count').count]).range(linkrange);

    let forceSVG    = d3.select(' #tagselector-container ')
        .append('svg')
        .attr('id', 'tagselector-canvas')
        .attr('width', width)
        .attr('height', height);

    let simulation = d3.forceSimulation()
        .force("link", d3.forceLink().id(function(d) { return d.name; }).distance((d) => (lengthScale(d.count))))
        .force("collision", d3.forceCollide().radius(radiusrange[1]))
        .force("charge", d3.forceManyBody())
        .force("center", d3.forceCenter(width / 2, height / 2));

    let link = forceSVG.append("g")
        .attr("class", "links")
        .selectAll("line")
        .data(linkData)
        .enter().append("line")
            .attr("style", "stroke: #999; stroke-opacity: 0.6;")
            .attr("stroke-width", "2");

    let node = forceSVG.append("g")
        .attr("class", "nodes")
        .selectAll(".node")
        .data(nodeData)
        .enter().append("g")
            .attr('class', 'node');

    node.append("circle")
        .attr("id", (d) => ("circle-" + _.kebabCase(d.name)))
        .attr("class", (d) => (_.includes(activeSec, d.name) ? 'nodes-selected' : ''))
        .attr("r", (d) => (sizeScale(d.count) - .75))
        .attr("style", "cursor:pointer")
        .attr("fill", '#98df8a')
        .on("click", (o) => {
            if ($( '#circle-' + _.kebabCase(o.name) ).hasClass( 'nodes-selected' )) {
                $( '#circle-' + _.kebabCase(o.name) ).removeClass( 'nodes-selected' );
                $(' #tagselector-container ').trigger('sector-change', ['remove', o.name]);
            } else {
                $( '#circle-' + _.kebabCase(o.name) ).addClass( 'nodes-selected' );
                $(' #tagselector-container ').trigger('sector-change', ['add', o.name]);
            }
        });

    node.append("text")
        .attr("font-size", "10px")
        .attr("text-anchor", "middle")
        // .attr("x", 0)
        .attr("y", 0)
        // .attr("y", (d) => (sizeScale(d.count) + 5))
        .attr('style', 'cursor:pointer')
        .text((o) => (o.name))
        .call(wrap, radiusrange[1] + 30);

    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));

    simulation
        .nodes(nodeData)
        .on("tick", ticked);

    simulation.force("link").links(linkData);

    function ticked() {
        link
            .attr("x1", function(d) { return d.source.x; })
            .attr("y1", function(d) { return d.source.y; })
            .attr("x2", function(d) { return d.target.x; })
            .attr("y2", function(d) { return d.target.y; });

        node.attr("transform", function(d) { return "translate(" + Math.max(radiusrange[1], Math.min(width - radiusrange[1], d.x)) + "," + Math.max(radiusrange[1], Math.min(height - radiusrange[1], d.y)) + ")"; });
    }

    function dragstarted(d) {  if (!d3.event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
    function dragged(d) { d.fx = d3.event.x; d.fy = d3.event.y; }
    function dragended(d) { if (!d3.event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }

    function wrap(text, width) {
        text.each(function() {
            let text        = d3.select(this);
            let words       = text.text().split(/\s+/).reverse();
            let word;

            let y           = text.attr("y");
            let tspan       = text.text(null).append("tspan").attr("x", 0).attr("y", y);

            let line        = [];
            let lineNumber  = 0;
            let lineHeight  = 1; // ems
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line    = [word];
                    tspan   = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + 0 + "em").text(word);
                }
            }
        });
    }
}
