function createSwimlane(data, activeSec, startDate, endDate) {
    d3.select(' #swimlane-canvas ').remove();
    let sectorsLeft = _.chain(data).flatMap('t').uniq().difference(activeSec).sortBy().value();
    let sectors     = _.chain(activeSec).sortBy().concat(sectorsLeft).value();

    let dateFormat  = "%Y-%m-%_d";
    let padding     = { top: 5, right: 15, bottom: 10, left: 15 };
    let width       = ($(' #tagselector-container ').outerWidth(true) * 2 / 3) - padding.right - padding.left;
    let height      = ($(' #wrapper ').outerHeight(true) / 2) - padding.top - padding.bottom;

    let axisHeight  = 20;
    let laneHeight  = 25;
    let sectorFont  = 10;
    let sectorWidth = 125;

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
            // .on('click', () => {
            //     let point   = d3.mouse(d3.select(' #floor-lane-svg ').node());
            //     let idx     = _.floor(point[1] / laneHeight);
            //     let sec     = _.nth(sectors, idx);
            //
            //     if ($( '#select-' + _.kebabCase(sec) ).hasClass( 'floor-lane-selected' )) {
            //         $( '#select-' + _.kebabCase(sec) ).removeClass( 'floor-lane-selected' );
            //         $(' #tagselector-container ').trigger('sector-change', ['remove', sec]);
            //     } else {
            //         $( '#select-' + _.kebabCase(sec) ).addClass( 'floor-lane-selected' );
            //         $(' #tagselector-container ').trigger('sector-change', ['add', sec]);
            //     }
            // });

    let swimlanePaths   = {};
    _.chain(data).groupBy('t').mapValues((o) => (_.chain(o).flatMap('d').value())).forEach((val, key) => {
        let keys    = key.split(',');
        _.forEach(val, (o) => {
            _.forEach(keys, (k) => {
                if (_.isNil(swimlanePaths[k])) { swimlanePaths[k] = d3.path(); }

                swimlanePaths[k].moveTo(sectorWidth + x(d3DateParse(moment(o.s).isAfter(startDate) ? o.s : startDate)), (laneHeight * 0.5));
                swimlanePaths[k].lineTo(sectorWidth + x(d3DateParse(moment(moment(o.e).isBefore(endDate) ? o.e : endDate).add(1, 'd').format('YYYY-MM-DD'))), (laneHeight * 0.5));
            });
        });
    }).value();

    let separatorPath   = d3.path();
    _.forEach(sectors, (sector, idx) => {
        separatorPath.moveTo(sectorWidth, ((idx + 1) * laneHeight));
        separatorPath.lineTo(width, ((idx + 1) * laneHeight));
    });
    separatorPath.closePath();
    floorLane.append('path').attr('d', separatorPath.toString()).attr('id', 'separator-line');

    let groups  = floorLane.selectAll(' g.sector-groups ')
        .data(sectors)
        .enter().append('g')
            .attr('class', 'sector-groups')
            .attr('id', (d) => ('group-' + _.kebabCase(d)))
            .attr('transform', (d, i) => ('translate(0,' + (i * laneHeight) + ')'));

    groups.append('text')
        .text((d) => (d))
        .attr('class', 'lane-sector noselect cursor-default')
        .attr('x', 5)
        .attr('y', 15)
        .style('font-size', sectorFont + 'px');

    groups.append('rect')
        .attr('id', (d) => ('select-' + _.kebabCase(d)))
        .attr('class', (d) => (_.includes(activeSec, d) ? 'floor-lane-selected' : ''))
        .attr('fill', 'transparent')
        .attr('width', width)
        .attr('height', laneHeight);

    groups.append('path').attr('d', (d) => (swimlanePaths[d].toString())).attr('class', 'swimlane-lane');

    groups.on('click', (o) => {
        if ($( '#select-' + _.kebabCase(o) ).hasClass( 'floor-lane-selected' )) {
            $( '#select-' + _.kebabCase(o) ).removeClass( 'floor-lane-selected' );
            $(' #tagselector-container ').trigger('sector-change', ['remove', o]);

            redrawOrder();
        } else {
            $( '#select-' + _.kebabCase(o) ).addClass( 'floor-lane-selected' );
            $(' #tagselector-container ').trigger('sector-change', ['add', o]);

            redrawOrder();
        }
    });

    $(' #tagselector-container ').on('sector-change', (event, state, sector) => {
        if (state == 'add') {
            $( '#select-' + _.kebabCase(sector) ).addClass( 'floor-lane-selected' );
        } else if (state == 'remove') {
            $( '#select-' + _.kebabCase(sector) ).removeClass( 'floor-lane-selected' );
        }

        redrawOrder();
    });

    function redrawOrder(state, sector) {
        _.chain(activeSec).sortBy().concat(_.chain(sectors).difference(activeSec).sortBy().value()).forEach((o, i) => {
            d3.select('#group-' + _.kebabCase(o) ).attr('transform', ('translate(0,' + (i * laneHeight) + ')'));
        }).value()
    }

}
