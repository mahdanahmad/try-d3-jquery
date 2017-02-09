let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in KB)', value : 'filesize' },
];

let frequencies = [];
let activeFreq  = [];
let activeSec   = [];
let selState    = 'swimlane';
let rawdata     = [];

let exclude     = ['China']

let baseURL     = "http://localhost:5000/";

$(' #tagselector-container ').on('sector-change', (event, state, sector) => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();

    if (state == 'add') {
        activeSec.push(sector);
    } else if (state == 'remove') {
        _.pull(activeSec, sector);
    }

    createStacked(_.filter(raw_data, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

$(' #chart-container ').on('keys-change', (event, state, key) => {
    if (state == 'add') {
        activeFreq.push(key);
    } else if (state == 'remove') {
        _.pull(activeFreq, key);
    }

    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(_.filter(raw_data, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

$(' #radio-container ').change(() => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(_.filter(raw_data, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
});

$(' #tagselector-changer ').click(() => {
    if (selState == 'swimlane') {
        selState = 'graph';
        $(' #tagselector-changer ').html('Change to swimlane');
        createForce(raw_data, activeSec);
    } else if (selState == 'graph') {
        selState = 'swimlane';
        $(' #tagselector-changer ').html('Change to graph');
        createSwimlane(raw_data, activeSec);
    }
});

window.onload   = function() {
    let stringRadio = _.chain(radio).map((o) => ('<input type="radio" id="radio-' + o['value'] + '" name="radio-graph" value="' + o['value'] + '"> ' + o['title'])).value().join(" ");
    $(' #radio-container ').append(stringRadio);
    $(' #radio-' + _.head(radio)['value'] ).prop('checked',true);
    $(' #tagselector-changer ').html("Change to graph");
    $(' #tagselector-changer ').css('top', -($(' #wrapper ').outerHeight(true) / 3 + 38));

    $.getJSON('data/result.json', (result) => {
        raw_data    = _.filter(result, (o) => (_.size(o.d) > 0));
        frequencies = _.chain(result).flatMap('d').map('f').uniq().sortBy(_.toInteger).value();
        activeFreq  = _.clone(frequencies);

        let headSec = _.chain(result).filter((o) => (_.size(o.d) > 0)).flatMap('t').uniq().sortBy().head().value()
        activeSec.push(headSec);

        createSwimlane(result, activeSec);

        let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
        createStacked(_.filter(raw_data, (o) => (_.intersection(activeSec, o.t).length > 0)), radiovalue, frequencies, activeFreq);
    });
};
