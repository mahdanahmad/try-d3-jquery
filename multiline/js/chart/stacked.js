function createStacked(data, radiovalue, keys, activeKeys) {
    d3.select(' #stacked-svg ').remove();

    let datasets    = _.chain(data).flatMap('d');
    let startDate   = moment(datasets.map('s').uniq().minBy((o) => (new Date(o))).value()).subtract(1, 'd').format('YYYY-MM-DD');
    let endDate     = datasets.map('e').uniq().maxBy((o) => (new Date(o))).value();

    let dateFormat  = "%Y-%m-%_d";
    let legendHgt   = 30;
    let padding     = { top: 15, right: 15, bottom: 15, left: 30 };
    let width       = $(' #stacked-chart ').outerWidth(true) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) * 2 / 3) - $(' #radio-container ').outerHeight() - padding.top - padding.bottom - legendHgt;

    // $(' #stacked-chart ').width(width);
    // $(' #stacked-chart ').height(height + legendHgt);
    // $(' #stacked-chart ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let d3DateParse = d3.timeParse(dateFormat);

    let colors      = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];

    let timeline    = [];
    let maxData     = 0;
    async.map(datasets.value(), (o, callback) => {
        async.times(moment(o.e).diff(o.s, 'days') + 1, (d, next) => {
            let currentDate = moment(o.s).add(d, 'd').format('YYYY-MM-DD');
            switch (radiovalue) {
                case 'rows': next(null, {date : currentDate, freq : o.f, val : o.r}); break;
                case 'filesize': next(null, {date : currentDate, freq : o.f, val : (o.z / 1000)}); break;
                default: next(null, {date : currentDate, freq : o.f, val : 1});
            }
        }, function(err, results) {
            callback(null, results);
        });
    }, (err, results) => {
        let chained = _.chain(results).flatten().groupBy('date');
        timeline    = chained.map((val, key) => ({date : key, data : _.chain(val).groupBy('freq').map((fval, fkey) => ({freq : parseInt(fkey), val : _.sumBy(fval, 'val')})).value()})).value();
        maxData     = chained.map((o) => (_.sumBy(o, 'val'))).max().value();
        if (maxData == 0) { maxData++; }

    });

    let x           = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width]);
    // let defaultx    = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width]);
    let y           = d3.scaleLinear().domain([-maxData, maxData]).range([height, 0]);

    let xAxis       = d3.axisTop(x).tickSize(5);
    let yAxis       = d3.axisLeft(y).tickSize(3).tickFormat((d) => (d3.format('')(Math.abs(d))));

    var svg = d3.select(' #stacked-chart ').append('svg')
        .attr('id', 'stacked-svg')
        .attr('width', width + padding.right + padding.left)
        .attr('height', height + padding.top + padding.bottom + legendHgt)
        .append("g")
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');

    let barwidth    = width / moment(endDate).diff(moment(startDate), 'days');
    svg.append("g")
        .selectAll("g")
        .data(timeline)
        .enter().append("g")
            .attr("transform", (d) => ("translate(" + x(d3DateParse(d.date)) + ",0)"))
            .selectAll("rect")
            .data((d) => (_.chain(d.data).filter((o) => (_.includes(activeKeys, o['freq']))).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['val'] + prev, freq : val['freq']}); return res;}, []).value()))
            .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d) => (y(d.curr)))
                .attr("height", (d) => (y(d.prev) - y(d.curr)))
                .attr("width", barwidth)
                .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                .attr("shape-rendering", "crispEdges");

    svg.append("g")
        .selectAll("g")
        .data(timeline)
        .enter().append("g")
            .attr("transform", (d) => ("translate(" + x(d3DateParse(d.date)) + ",0)"))
            .selectAll("rect")
            .data((d) => (_.chain(d.data).filter((o) => (_.includes(activeKeys, o['freq']))).reduce((res, val) => {let prev = res.length > 0 ? res[res.length - 1]['curr'] : 0; res.push({prev : prev, curr : val['val'] + prev, freq : val['freq']}); return res;}, []).value()))
            .enter().append("rect")
                .attr("x", 0)
                .attr("y", (d) => (y(-d.prev)))
                .attr("height", (d) => (y(d.prev) - y(d.curr)))
                .attr("width", barwidth)
                .attr("fill", (d) => (colors[_.indexOf(keys, d.freq)]))
                .attr("shape-rendering", "crispEdges");

    // centerLine
    svg.append('g')
        .attr('class', 'center-line')
        .attr('transform', 'translate(0,' + y(0) + ')')
        .attr('width', width)
        .call(xAxis)
        .selectAll('text')
            // .attr('dx', 23)
            // .attr('dy', 12)
            .attr('class', 'noselect cursor-default');

    // leftAxis
    svg.append('g')
        .attr('class', 'left-line')
        .attr('transform', 'translate(0,0)')
        .attr('height', height)
        .call(yAxis)
        .selectAll('text')
            // .attr('dx', 23)
            // .attr('dy', 12)
            .attr('class', 'noselect cursor-default');

    var legend  = svg.append('g')
        .attr('id', 'legend-group')
        .attr('transform', 'translate(' + (width * 2 / 3) + ', ' + (height + legendHgt - 20) + ')')
        .selectAll('.legend')
            .data(keys)
            .enter().append('g')
                .attr('class', 'legend noselect')
                .attr('transform', (o, i) => ('translate(' + (i * (width / 16))  + ', 0)'));

    legend.append('rect')
        .attr('class', (o) => ('rect-' + o + (_.includes(activeKeys, o) ? '' : ' fill-none')))
        .attr('fill', (o) => (colors[_.indexOf(keys, o)]))
        .attr('stroke', (o) => (colors[_.indexOf(keys, o)]))
        .attr('stroke-width', '1.5px')
        .on('click', (d) => {
            if ($( '.rect-' + d ).hasClass( 'fill-none' )) {
                $( '.rect-' + d ).removeClass( 'fill-none' );
                $(' #chart-container ').trigger('keys-change', ['add', d]);
            } else {
                $( '.rect-' + d ).addClass( 'fill-none' );
                $(' #chart-container ').trigger('keys-change', ['remove', d]);
            }

        });

    legend.append('text')
        .attr('y', 14)
        .attr('x', 23)
        .style('font-size', '12px')
        .attr('class', (o) => ('text-' + o))
        .text((o) => (_.upperFirst(o) + ' days'));
}
