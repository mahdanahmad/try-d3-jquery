function createStacked(data, endDate, startDate) {
    d3.select(' #stacked-svg ').remove();

    let dateFormat  = "%Y-%m-%_d";
    let padding     = { top: 15, right: 15, bottom: 15, left: 15 };
    let width       = $(' #stacked-chart ').outerWidth(true) - padding.right - padding.left;
    let height      = ($(' #stacked-chart ').outerWidth(true) / 4) - padding.top - padding.bottom;
    let legendHgt   = 30;

    $(' #stacked-chart ').width(width);
    $(' #stacked-chart ').height(height + legendHgt);
    $(' #stacked-chart ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let d3DateParse = d3.timeParse(dateFormat);

    let maxData     = _.chain(data).find(['state', 'daily']).get('data').maxBy('y1').value().y1;
    let keys        = _.map(data, 'state');

    let x           = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width]);
    let y           = d3.scaleLinear().domain([-maxData, maxData]).range([height, 0]);

    let positiveArea    = d3.area().x((o) => (x(d3DateParse(o.date)))).y0((o) => (y(o.y0))).y1((o) => (y(o.y1)));
    let negativeArea    = d3.area().x((o) => (x(d3DateParse(o.date)))).y0((o) => (y(-o.y0))).y1((o) => (y(-o.y1)));

    var svg = d3.select(' #stacked-chart ').append('svg')
        .attr('id', 'stacked-svg')
        .attr('width', width)
        .attr('height', height + legendHgt);

    svg.append('g')
        .selectAll('.positive-layer')
        .data(data)
        .enter().append('path')
            .attr('class', (d) => ('positive-layer stacked-layers layer-' + d.state ))
            .attr('d', (d) => (positiveArea(d.data)));

    svg.append('g')
        .selectAll('.negative-layer')
        .data(data)
        .enter().append('path')
            .attr('class', (d) => ('negative-layer stacked-layers layer-' + d.state ))
            .attr('d', (d) => (negativeArea(d.data)));

    // centerLine
    svg.append('g')
        .attr('class', 'center-line')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .attr('width', width)
        .call(d3.axisTop(x).tickSize(12).tickFormat(d3.timeFormat('%b %Y')))
        .selectAll('text')
            .attr('dx', 23)
            .attr('dy', 12)
            .attr('class', 'noselect cursor-default');;

    var legend  = svg.append('g')
        .attr('id', 'legend-group')
        .attr('transform', 'translate(' + (width * 3 / 4) + ', ' + (height + legendHgt - 20) + ')')
        .selectAll('.legend')
            .data(keys)
            .enter().append('g')
                .attr('class', 'legend noselect')
                .attr('transform', (o, i) => ('translate(' + (i * (width / 16))  + ', 0)'));

    legend.append('rect')
        .attr('class', (o) => ('rect-' + o));

    legend.append('text')
        .attr('y', 14)
        .attr('x', 23)
        .style('font-size', '12px')
        .attr('class', (o) => ('text-' + o))
        .text((o) => (_.upperFirst(o)));
}
