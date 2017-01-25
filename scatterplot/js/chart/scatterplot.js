function createScatter(data) {
    let dateSrc     = "YYYY-MM-DD";
    let dateFormat  = "%Y-%m-%_d";
    let legendWdt   = 150;
    let legendFont  = 10;
    let padding     = { top: 15, right: 15, bottom: 15, left: 15 };
    let width       = $(' #root ').outerWidth(true) - padding.right - padding.left;
    let height      = $(' #root ').outerHeight(true) - padding.top - padding.bottom;
    let lineSize    = 25;

    $(' #root ').add(' div ').addClass().attr('id', 'scatter-chart');
    $(' #scatter-chart ').width(width);
    $(' #scatter-chart ').height(height);
    $(' #scatter-chart ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let maxData     = _.maxBy(data.data, 'y').y + 2
    let d3DateParse = d3.timeParse(dateFormat);
    let gapWidht    = (width - legendWdt - lineSize) / moment(data.endDate, dateSrc).diff(moment(data.startDate, dateSrc), 'months') / _.size(data.sectors);
    let gapHeight   = (height - lineSize) / maxData / _.size(data.sectors);

    let x           = d3.scaleTime().domain([d3DateParse(data.startDate), d3DateParse(data.endDate)]).range([lineSize, width - legendWdt]);
    let y           = d3.scaleLinear().domain([0, maxData]).range([height - lineSize, 0]);

    let dataSource  = _.map(data.data, (o) => _.extend(o, {'cx' : x(d3DateParse(o.date)) + (gapWidht * _.random(0, _.size(data.sectors)))}, {'cy' : y(o.y) - (gapHeight * _.random(0, _.size(data.sectors)))}))
    let byType      = _.groupBy(dataSource, (o) => (o.sector + '-' + o.type));
    let byDate      = _.groupBy(dataSource, (o) => (o.sector + '-' + o.date));

    var svg = d3.select(' #scatter-chart ').append('svg')
        .attr('id', 'scatter-svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('g')
        .attr('class', 'x axis')
        .attr('transform', 'translate(0,' + (height  - lineSize) + ')')
        .attr('width', (width - lineSize))
        .call(d3.axisBottom(x))
        .selectAll('text')
            // .attr('dx', 23)
            // .attr('dy', 12)
            .attr('class', 'noselect cursor-default');

    svg.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + lineSize + ',0)')
        .attr('height', (height - lineSize))
        .call(d3.axisLeft(y))
        .selectAll('text')
            // .attr('dx', 23)
            // .attr('dy', 12)
            .attr('class', 'noselect cursor-default');

    svg.selectAll(".dot")
        .data(dataSource)
        .enter().append("circle")
            .attr("class", (o) => ("dot dot-" + o.type))
            .attr("r", 3.5)
            .attr("cx", (o) => (o.cx))
            .attr("cy", (o) => (o.cy))
            .on('mouseover', function(d, i) {
                let self    = d3.select(this);

                d3.select(' #scatter-svg ').append('path')
                    .data([_.orderBy(byType[d.sector + '-' + d.type], 'cx', 'asc').concat([{ cx : (width - legendWdt + 20), cy : (_.indexOf(data.sectors, d.sector) * legendLane + 28) }])])
                    .attr('id', 'hover-path-type')
                    .attr('d', d3.line().x((d) => (d.cx)).y((d) => (d.cy)));
                d3.select(' #scatter-svg ').append('path')
                    .data([_.orderBy(byDate[d.sector + '-' + d.date], 'cy', 'asc').concat([{ cx : x(d3DateParse(d.date)), cy : y(0) }])])
                    .attr('id', 'hover-path-date')
                    .attr('d', d3.line().x((d) => (d.cx)).y((d) => (d.cy)));
                d3.select(' #scatter-svg ').append('circle')
                    .attr('id', 'hover-circle')
                    .attr('r', 10)
                    .attr('cx', d.cx)
                    .attr('cy', d.cy)
                    .on('mouseout', function() {
                        d3.selectAll(' #hover-circle ').remove();
                        d3.selectAll(' #hover-path-type ').remove();
                        d3.selectAll(' #hover-path-date ').remove();
                    });

            });

    let legendLane  = (height - lineSize) / _.size(data.sectors);
    svg.append('g')
        .attr('class', 'noselect cursor-default')
        .attr('transform', 'translate(' + (width - legendWdt + 25) + ', 25)')
        .selectAll('.list-sector')
        .data(data.sectors)
        .enter().append('text')
            .text((o) => (o))
            .attr('class', 'list-sector')
            .attr('x', 0)
            .attr('y', (o) => ((_.indexOf(data.sectors, o) * legendLane) + 5))
            .style('font-size', legendFont + 'px');
}
