let radio       = [
    { title : 'Dataset', value : 'dataset' },
    { title : 'Questions', value : 'questions' },
    { title : 'Respondents', value : 'respondents' },
    { title : 'Questions x Respondents', value : 'joined' },
];

let alldata     = {};
let endDate     = "";
let startDate   = "";


$(' #swimlane-container ').on('sector-change', (event, sector) => {
    let radiovalue  = $(' input[name=radio-graph]:checked ', ' #radio-container ').val();
    randomStacked((error, stacked) => {
        alldata     = stacked.data;
        endDate     = stacked.endDate;
        startDate   = stacked.startDate;

        createStacked(alldata[radiovalue], endDate, startDate);
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

    randomSwimlane((error, swimlane) => { if (!error) { createSwimlane(swimlane); }});

};
