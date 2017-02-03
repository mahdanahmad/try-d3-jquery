let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in KB)', value : 'filesize' },
];

let alldata     = {};
let endDate     = "";
let startDate   = "";
let frequencies = [];
let activeFreq  = [];

let exclude     = ['China']

let baseURL     = "http://localhost:5000/";

$(' #swimlane-container ').on('sector-change', (event, sector) => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    // sector          = 'ipc';

    // let params      = {
    //     tag         : sector,
    //     exclude     : JSON.stringify(exclude),
    //     frequencies : JSON.stringify(frequencies),
    //     datatype    : radiovalue
    // }

    // $.getJSON(baseURL + 'stacked?' + jQuery.param(params), (result) => {
    $.getJSON('data/stackedbytags/' + sector + '.json', (result) => {
        alldata     = result.data;
        endDate     = result.endDate;
        startDate   = result.startDate;

        createStacked(alldata[radiovalue], result.endDate, result.startDate, frequencies, activeFreq);
    });
});

$(' #chart-container ').on('keys-change', (event, state, key) => {
    if (state == 'add') {
        activeFreq.push(key);
    } else if (state == 'remove') {
        _.pull(activeFreq, key);
    }

    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(alldata[radiovalue], endDate, startDate, frequencies, activeFreq);
});

$(' #radio-container ').change(() => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(alldata[radiovalue], endDate, startDate, frequencies, activeFreq);
});

window.onload   = function() {
    let stringRadio = _.chain(radio).map((o) => ('<input type="radio" id="radio-' + o['value'] + '" name="radio-graph" value="' + o['value'] + '"> ' + o['title'])).value().join(" ");
    $(' #radio-container ').append(stringRadio);
    $(' #radio-' + _.head(radio)['value'] ).prop('checked',true);

    // $.getJSON(baseURL + 'swimlane?exclude=' + JSON.stringify(exclude), (result) => { frequencies = result.avail_freq; createSwimlane(result) });
    $.getJSON('data/swimlanebytags.json', (result) => { frequencies = _(result.frequencies).uniq().sortBy(_.toInteger).value(); activeFreq = _.clone(frequencies), createSwimlane(result) });

};
