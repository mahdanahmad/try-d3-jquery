let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in MB)', value : 'filesize' },
];

let baseURL     = "http://139.59.230.55:3010/";

let frequencies = [];
let freqColors  = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];
let activeFreq  = [];
let activeSec   = [];
let filter      = {
    type        : null,
}

let exclude     = ['China'];

$(' #tagselector-container ').on('sector-change', (event, state, sector) => {
    let spinner     = new Spinner().spin(document.getElementById('root'));
    $(' #spinnerOverlay ').show();

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    } else if (state == 'write') {
        activeSec   = [sector];
        createSwimlane(rangeData, activeSec, activeFreq, startDate, endDate);
    }

    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
    fetchData(startDate, endDate, false, false, true, true, () => {
        $(' #spinnerOverlay ').hide();
        spinner.stop();
    });
});

$(document).on('click', '.type-button', (e) => {
    let spinner     = new Spinner().spin(document.getElementById('root'));
    $(' #spinnerOverlay ').show();

    filter.type     = $(e.target).attr('value');
    $(' .type-active ').removeClass('type-active');
    $('#type-' + filter.type).addClass('type-active');

    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
    fetchData(startDate, endDate, true, false, true, false, () => {
        $(' #spinnerOverlay ').hide();
        spinner.stop();
    });
});

$(document).on('click', '.freq-button', (e) => {
    let spinner     = new Spinner().spin(document.getElementById('root'));
    $(' #spinnerOverlay ').show();

    let selected    = _.toInteger($(e.target).attr('value'));
    if ($('#freq-' + selected).hasClass('freq-unactive')) {
        $('#freq-' + selected).removeClass('freq-unactive');
        activeFreq.push(selected);
    } else {
        $('#freq-' + selected).addClass('freq-unactive');
        _.pull(activeFreq, selected);
    }

    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
    fetchData(startDate, endDate, true, true, true, true, () => {
        $(' #spinnerOverlay ').hide();
        spinner.stop();
    });
});

$(document).on('click', '#button-changer', (e) => {
    if ($(' #swimlane-chart ').is(":visible")) {
        $(' #swimlane-chart ').hide();
        $(' #datasets-wrapper ').show();

        $(' #button-changer ').html('See swimlane');
    } else {
        $(' #swimlane-chart ').show();
        $(' #datasets-wrapper ').hide();

        $(' #button-changer ').html('See datasets');
    }
});

function drawListDataset(data) {
    $(' #datasets-container ').html(
        _.chain(data).filter((o) => (_.intersection(o.tags, activeSec).length > 0)).map((o, idx) => (
            "<div id='data-" + _.kebabCase(o._id) + "' class='data-container noselect cursor-default'>" +
                "<div class='data-title'>" + o._id + "</div>" +
                "<div class='data-tags'>" + _.chain(o.tags).intersection(activeSec).map((t) => ("<div class='data-tag'>" + t + "</div>")).sortBy(_.size).value().join('') + "</div>" +
                "<div class='data-connect'></div>" +
             "</div>"
        )).value()
    );
}

function fetchData(startDate, endDate, isForce, isSwimlane, isStacked, isRedraw, callback) {
    $.get( baseURL + 'selector', { frequencies : JSON.stringify(activeFreq), datatype : filter.type, startDate, endDate }, (response) => {
        tagChain    = _.chain(response.result).flatMap('tags').uniq();

        if (tagChain.intersection(activeSec).size().value() == 0) { activeSec = [tagChain.sortBy().head().value()]; }

        if (isForce) { createForce(response.result, activeSec); }
        if (isSwimlane) { createSwimlane(response.result, activeSec, startDate, endDate); }
        if (isRedraw) { drawListDataset(response.result); }
    }).always(() => {
        if (isStacked) {
            $.get( baseURL + 'stacked', { frequencies : JSON.stringify(activeFreq), tags : JSON.stringify(activeSec), datatype : filter.type, startDate, endDate }, (response) => {
                createStacked(response.result, frequencies, freqColors);
            }).always(() => {
                callback();
            });
        } else {
            callback();
        }
    });
}

window.onload   = function() {
    let spinner     = new Spinner().spin(document.getElementById('root'));

    let stringType  = _.map(radio, (o) => ("<div id='type-" + o.value + "' class='type-button noselect cursor-pointer' value='" + o.value + "'>" + o.title + "</div>")).join('');
    $(' #types-container ').append(stringType);
    filter.type     = _.head(radio).value;
    $('#type-' + filter.type).addClass('type-active');

    let dateFormat  = 'dd MM yy';
    let dateConfig  = { showOtherMonths: true, selectOtherMonths: true, changeMonth: true, changeYear: true, dateFormat : dateFormat }
    let fromPicker  = $(' #startpicker ').datepicker(dateConfig);
    let untilPicker = $(' #endpicker ').datepicker(dateConfig);

    $(' #filter-wrapper ').height($(' #wrapper ').outerHeight(true) / 2);

    $(' #datasets-wrapper ').width($(' #tagselector-container ').outerWidth(true) * 2 / 3);
    $(' #datasets-wrapper ').height($(' #wrapper ').outerHeight(true) / 2 - 40);

    fromPicker.datepicker( 'setDate', moment().subtract(6, 'year').startOf('year').toDate() );
    untilPicker.datepicker( 'setDate', '0' );
    fromPicker.datepicker( 'option', 'maxDate', untilPicker.datepicker('getDate') );
    untilPicker.datepicker( 'option', 'minDate', fromPicker.datepicker('getDate') );

    fromPicker.on('change', () => {
        untilPicker.datepicker( 'option', 'minDate', fromPicker.datepicker('getDate') );

        redrawOnDatepickerChange();
    });

    untilPicker.on('change', () => {
        fromPicker.datepicker( 'option', 'maxDate', untilPicker.datepicker("getDate") );

        redrawOnDatepickerChange();
    });

    $.get( baseURL + 'config', (response) => {
        frequencies     = response.result.frequency;
        activeFreq      = _.clone(frequencies);

        let stringFreq  = _.map(frequencies, (o, idx) => ("<div id='freq-" + o + "' class='freq-button noselect cursor-pointer' style='background : " + freqColors[idx] + "; border-color : " + freqColors[idx] + "' value='" + o + "'>" + o + "</div>"));
        $(' #frequency-container ').append(stringFreq);

        let startDate   = $.datepicker.formatDate('yy-mm-dd', fromPicker.datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', untilPicker.datepicker('getDate'));
        fetchData(startDate, endDate, true, true, true, true, () => {
            $(' #spinnerOverlay ').css('opacity', '0.7');
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    });

    function redrawOnDatepickerChange() {
        let spinner     = new Spinner().spin(document.getElementById('root'));
        $(' #spinnerOverlay ').show();

        let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
        fetchData(startDate, endDate, true, true, true, true, () => {
            $(' #spinnerOverlay ').hide();
            spinner.stop();
        });
    }
};
