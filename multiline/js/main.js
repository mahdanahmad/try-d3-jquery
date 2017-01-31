let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Rows', value : 'rows' },
    { title : 'Filesize (in KB)', value : 'filesize' },
];

let alldata     = {};
let endDate     = "";
let startDate   = "";

$(' #swimlane-container ').on('sector-change', (event, sector) => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    // randomStacked((error, stacked) => {
    //     alldata     = stacked.data;
    //     endDate     = stacked.endDate;
    //     startDate   = stacked.startDate;
    //
    //     createStacked(alldata[radiovalue], endDate, startDate);
    // });
    $.getJSON('data/stackedbytags/' + sector + '.json', (result) => {
        alldata     = result.data;
        endDate     = result.endDate;
        startDate   = result.startDate;

        createStacked(alldata[radiovalue], result.endDate, result.startDate);
    });
});

$(' #radio-container ').change(() => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    createStacked(alldata[radiovalue], endDate, startDate);
});

window.onload   = function() {
    let stringRadio = _.chain(radio).map((o) => ('<input type="radio" id="radio-' + o['value'] + '" name="radio-graph" value="' + o['value'] + '"> ' + o['title'])).value().join(" ");
    $(' #radio-container ').append(stringRadio);
    $(' #radio-' + _.head(radio)['value'] ).prop('checked',true);

    // randomSwimlane((error, swimlane) => { if (!error) { createSwimlane(swimlane); }});
    $.getJSON('data/swimlanebytags.json', (result) => { createSwimlane(result) });

};
