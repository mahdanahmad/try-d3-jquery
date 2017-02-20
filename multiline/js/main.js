let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in MB)', value : 'filesize' },
];

let frequencies = [];
let freqColors  = ['#BBCDA3', '#055C81', '#B13C3D', '#CCB40C', '#DA9F93'];
let activeFreq  = [];
let activeSec   = [];
let rawData     = [];
let rangeData   = [];
let filter      = {
    type        :  null
}

let exclude     = ['China'];

$(' #tagselector-container ').on('sector-change', (event, state, sector) => {
    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    } else if (state == 'write') {
        activeSec   = [sector];
        createSwimlane(rangeData, activeSec, activeFreq, startDate, endDate);
    }

    $(' #datasets-container ').html(_.chain(rangeData).filter((o) => (_.intersection(o.t, activeSec).length > 0)).map((o, idx) => ("<div id='data-" + _.kebabCase(o.n) + "' class='data-button noselect cursor-default' title='" + o.n + "'>" + o.n + "</div>")).value());

    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), filter.type, frequencies, activeFreq, startDate, endDate, freqColors);
});

$(document).on('click', '.type-button', (e) => {
    filter.type     = $(e.target).attr('value');
    $(' .type-active ').removeClass('type-active');
    $('#type-' + filter.type).addClass('type-active');

    let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
    let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));
    createForce(rangeData, activeSec, activeFreq, filter.type);
    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), filter.type, frequencies, activeFreq, startDate, endDate, freqColors);
});

$(document).on('click', '.freq-button', (e) => {
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
    createForce(rangeData, activeSec, activeFreq, filter.type);
    createSwimlane(rangeData, activeSec, activeFreq, startDate, endDate);
    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), filter.type, frequencies, activeFreq, startDate, endDate, freqColors);
});

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

    $.getJSON('data/elnino-result.json', (result) => {
        let resource    = _.chain(result).flatMap('d');
        frequencies     = resource.map('f').uniq().sortBy(_.toInteger).value();
        activeFreq      = _.clone(frequencies);

        let stringFreq  = _.map(frequencies, (o, idx) => ("<div id='freq-" + o + "' class='freq-button noselect cursor-pointer' style='background : " + freqColors[idx] + "; border-color : " + freqColors[idx] + "' value='" + o + "'>" + o + "</div>"));
        $(' #frequency-container ').append(stringFreq);

        let startDate   = $.datepicker.formatDate('yy-mm-dd', fromPicker.datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', untilPicker.datepicker('getDate'));

        let datasets    = _.chain(result);
        rawData         = datasets.filter((o) => (_.size(o.d) > 0)).value();
        let rangesets   = _.chain(result).map((o) => ({ d : _.chain(o.d).filter((r) => (moment(r.e).isAfter(startDate) && moment(r.s).isBefore(endDate))).value(), g : o.g, n : o.n, t : o.t })).filter((o) => (_.size(o.d) > 0))
        rangeData       = rangesets.value();
        activeSec.push(rangesets.flatMap('t').uniq().sortBy().head().value());

        createForce(rangesets.value(), activeSec, activeFreq, filter.type);
        createSwimlane(rangesets.value(), activeSec, activeFreq, startDate, endDate);
        createStacked(_.filter(rangesets.value(), (o) => (_.intersection(activeSec, o.t).length > 0)), filter.type, frequencies, activeFreq, startDate, endDate, freqColors);

        $(' #datasets-container ').html(_.chain(rangeData).filter((o) => (_.intersection(o.t, activeSec).length > 0)).map((o, idx) => ("<div id='data-" + _.kebabCase(o.n) + "' class='data-button noselect cursor-default' title='" + o.n + "'>" + o.n + "</div>")).value());

        $(' #spinnerOverlay ').hide();
        spinner.stop();
    });

    function redrawOnDatepickerChange() {
        let startDate   = $.datepicker.formatDate('yy-mm-dd', $(' #startpicker ').datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', $(' #endpicker ').datepicker('getDate'));

        let rangesets   = _.chain(rawData).map((o) => ({ d : _.chain(o.d).filter((r) => (moment(r.e).isAfter(startDate) && moment(r.s).isBefore(endDate))).value(), g : o.g, n : o.n, t : o.t })).filter((o) => (_.size(o.d) > 0))
        rangeData       = rangesets.value();

        sameSec         = rangesets.flatMap('t').uniq().intersection(activeSec).value();
        if (sameSec.length > 0) {
            activeSec   = sameSec;
        } else {
            activeSec   = [rangesets.flatMap('t').uniq().sortBy().head().value()];
        }

        createForce(rangesets.value(), activeSec, activeFreq, filter.type);
        createSwimlane(rangesets.value(), activeSec, activeFreq, startDate, endDate);
        createStacked(_.filter(rangesets.value(), (o) => (_.intersection(activeSec, o.t).length > 0)), filter.type, frequencies, activeFreq, startDate, endDate, freqColors);
    }
};
