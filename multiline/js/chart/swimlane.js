function createSwimlane(data, activeSec, startDate, endDate) {
    d3.select(' #swimlane-canvas ').remove();
    let sectors     = _.chain(data).flatMap('t').uniq().sortBy().value();

    let dateFormat  = "%Y-%m-%_d";
    let padding     = { top: 5, right: 15, bottom: 0, left: 15 };
    let width       = ($(' #tagselector-container ').outerWidth(true) * 2 / 3) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) / 2) - padding.top - padding.bottom;

    let axisHeight  = 20;
    let laneHeight  = 25;
    let sectorFont  = 10;
    let sectorWidth = 100;

    $(' #swimlane-container ').width(width);
    $(' #swimlane-container ').height(height);
    $(' #swimlane-container ').css('padding', padding.top + 'px ' + padding.right + 'px ' + padding.bottom + 'px ' + padding.left + 'px');

    let d3DateParse = d3.timeParse(dateFormat);
    let x           = d3.scaleTime().domain([d3DateParse(startDate), d3DateParse(endDate)]).range([0, width - sectorWidth]);

    let swimlane    = d3.select(' #swimlane-container ')
        .append('div')
        .attr('id', 'swimlane-canvas')
        .attr('width', width)
        .attr('height', height);

    swimlane.append('svg')
        .attr('id', 'ceil-axis-container')
        .attr('style', 'width: ' + (width) + 'px; height: ' + axisHeight + 'px')
        .append('g')
            .attr('transform', 'translate(' + sectorWidth + ', ' + (axisHeight - 2)  + ')')
            .attr('class', 'ceil-axis-svg')
            .attr('width', width - sectorWidth)
            .attr('height', axisHeight)
            .call(d3.axisTop(x).tickSize(12).tickFormat(d3.timeFormat('%b %Y')))
            .selectAll('text')
                .attr('dx', -23)
                .attr('dy', 12)
                .attr('class', 'noselect cursor-default');

    let floorLane   = swimlane.append('div')
        .attr('id', 'floor-lane-container')
        .attr('style', 'width: ' + width + 'px; height: ' + (height - axisHeight) + 'px; overflow-y : auto;')
        .append('svg')
            .attr('width', width)
            .attr('height', (_.size(sectors) * laneHeight))
            .attr('id', 'floor-lane-svg')
            .on('mousedown', () => {
                let point   = d3.mouse(d3.select(' #floor-lane-svg ').node());
                let idx     = _.floor(point[1] / laneHeight);
                let sec     = _.nth(sectors, idx);

                if ($( '#select-' + _.kebabCase(sec) ).hasClass( 'floor-lane-selected' )) {
                    $( '#select-' + _.kebabCase(sec) ).removeClass( 'floor-lane-selected' );
                    $(' #tagselector-container ').trigger('sector-change', ['remove', sec]);
                } else {
                    $( '#select-' + _.kebabCase(sec) ).addClass( 'floor-lane-selected' );
                    $(' #tagselector-container ').trigger('sector-change', ['add', sec]);
                }
            });;

    floorLane.append('g')
        .attr('class', 'noselect cursor-default')
        .attr('transform', 'translate(10, 10)')
        .selectAll('.lane-sector')
        .data(sectors)
        .enter().append('text')
            .text((o) => (o))
            .attr('class', 'lane-sector')
            .attr('x', 0)
            .attr('y', (o) => ((_.indexOf(sectors, o) * laneHeight) + 5))
            .style('font-size', sectorFont + 'px');

    // $(' #tagselector-container ').trigger('sector-change', ['add', _.head(sectors)]);

    let separatorPath   = d3.path();
    _.forEach(sectors, (sector, idx) => {
        separatorPath.moveTo(sectorWidth, ((idx + 1) * laneHeight));
        separatorPath.lineTo(width, ((idx + 1) * laneHeight));

        floorLane.append('rect')
            .attr('id', 'select-' + _.kebabCase(sector))
            .attr('class', (_.includes(activeSec, sector) ? 'floor-lane-selected' : ''))
            .attr('fill', 'transparent')
            .attr('width', width)
            .attr('height', laneHeight)
            .attr('transform', 'translate(0,' + (idx * laneHeight) + ')');
    });
    separatorPath.closePath();
    floorLane.append('path').attr('d', separatorPath.toString()).attr('id', 'separator-line');

    let swimlanePath    = d3.path();
    _.chain(data).groupBy('t').mapValues((o) => (_.chain(o).flatMap('d').value())).forEach((val, key) => {
        let keys    = key.split(',');
        _.forEach(val, (o) => {
            _.forEach(keys, (k) => {
                // swimlanePath.moveTo(sectorWidth + x(d3DateParse(o.s)), _.indexOf(sectors, k) * laneHeight + (laneHeight * 0.5));
                // swimlanePath.lineTo(sectorWidth + x(d3DateParse(o.e)), _.indexOf(sectors, k) * laneHeight + (laneHeight * 0.5));

                swimlanePath.moveTo(sectorWidth + x(d3DateParse(moment(o.s).isAfter(startDate) ? o.s : startDate)), _.indexOf(sectors, k) * laneHeight + (laneHeight * 0.5));
                swimlanePath.lineTo(sectorWidth + x(d3DateParse(moment(moment(o.e).isBefore(endDate) ? o.e : endDate).add(1, 'd').format('YYYY-MM-DD'))), _.indexOf(sectors, k) * laneHeight + (laneHeight * 0.5));
            });
        });
    }).value();
    swimlanePath.closePath();
    floorLane.append('path').attr('d', swimlanePath.toString()).attr('id', 'swimlane-lane');

    $(' #tagselector-container ').on('sector-change', (event, state, sector) => {
        if (state == 'add') {
            $( '#select-' + _.kebabCase(sector) ).addClass( 'floor-lane-selected' );
        } else if (state == 'remove') {
            $( '#select-' + _.kebabCase(sector) ).removeClass( 'floor-lane-selected' );
        }
    });
}
