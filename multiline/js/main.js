let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in MB)', value : 'filesize' },
];

let frequencies = [];
let activeFreq  = [];
let activeSec   = [];
let rawData     = [];
let rangeData   = [];

let exclude     = ['China']

$(' #tagselector-container ').on('sector-change', (event, state, sector) => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    }

    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

$(' #chart-container ').on('keys-change', (event, state, key) => {
    if (state == 'add') {
        activeFreq.push(key);
    } else if (state == 'remove') {
        _.pull(activeFreq, key);
    }

    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

$(' #radio-container ').change(() => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(_.filter(rangeData, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

window.onload   = function() {
    let stringRadio = _.chain(radio).map((o) => ('<input type="radio" id="radio-' + o['value'] + '" name="radio-graph" value="' + o['value'] + '"> ' + o['title'])).value().join(" ");
    $(' #radio-container ').append(stringRadio);
    $(' #radio-' + _.head(radio)['value'] ).prop('checked',true);

    let dateFormat  = 'dd MM yy';
    let dateConfig  = { showOtherMonths: true, selectOtherMonths: true, changeMonth: true, changeYear: true, dateFormat : dateFormat }
    let fromPicker  = $(' #startpicker ').datepicker(dateConfig);
    let untilPicker = $(' #endpicker ').datepicker(dateConfig);

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

        let startDate   = $.datepicker.formatDate('yy-mm-dd', fromPicker.datepicker('getDate'));
        let endDate     = $.datepicker.formatDate('yy-mm-dd', untilPicker.datepicker('getDate'));

        let datasets    = _.chain(result);
        rawData         = datasets.filter((o) => (_.size(o.d) > 0)).value();
        let rangesets   = _.chain(result).map((o) => ({ d : _.chain(o.d).filter((r) => (moment(r.e).isAfter(startDate) && moment(r.s).isBefore(endDate))).value(), g : o.g, n : o.n, t : o.t })).filter((o) => (_.size(o.d) > 0))
        rangeData       = rangesets.value();
        activeSec.push(rangesets.flatMap('t').uniq().sortBy().head().value());

        console.log(rawData);

        createForce(rangesets.value(), activeSec, startDate, endDate);
        createSwimlane(rangesets.value(), activeSec, startDate, endDate);

        let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
        createStacked(_.filter(rangesets.value(), (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
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

            let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
            createStacked(_.filter(rangesets.value(), (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
        }

        createForce(rangesets.value(), activeSec, startDate, endDate);
        createSwimlane(rangesets.value(), activeSec, startDate, endDate);
    }
};
