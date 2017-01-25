let sectors     = ['health', 'environtment', 'housing', 'energy', 'education', 'geography', 'social', 'community', 'transportation', 'economy', 'weather', 'tourism', 'crime', 'accomodation', 'population'];
let yearsAgo    = 2;

function randomScatter(callback) {
    let dateFormat  = "YYYY-MM-DD";
    let startDate   = moment().subtract(yearsAgo, 'years');
    let endDate     = moment();

    let timespans   = ['daily', 'weekly', 'monthly', 'yearly'];
    let timespawn   = { 'daily' : 52, 'weekly' : 25, 'monthly' : 20, 'yearly' : 3 };
    let timevalue   = { 'daily' : 'days', 'weekly' : 'weeks', 'monthly' : 'months', 'yearly' : 'years' };
    let reversed    = _.chain(timespans).clone().reverse().value();

    let data        = [];
    let sampleSect  = _.sampleSize(sectors, 10);
    _.forEach(sampleSect, (sector) => {
        let rawData     = [];
        _.forEach(timespawn, (value, key) => {
            _.times(value, () => {
                let currentStart    = moment().subtract(_.random(1, yearsAgo * 365), 'days');
                let timeskip    = 0;
                switch (key) {
                    case 'daily': timeskip = _.random(30, 50); break;
                    case 'yearly': timeskip = 1; break;
                    default: timeskip = _.random(1, 5); break;
                }

                rawData.push({
                    'timespan'  : key,
                    'date'      : {
                        'start' : currentStart,
                        'end'   : currentStart.clone().add(timeskip, timevalue[key])
                    }
                });
            });

        });

        _.times(endDate.diff(startDate, 'months'), (i) => {
            let currentDate = startDate.clone().add(i, 'months');
            let counter     = 0;
            _.each(reversed, (key) => {
                counter     += _(rawData).filter((o) => (currentDate.isBetween(o.date.start, o.date.end) && (o.timespan === key))).size();
                data.push({
                    date    : currentDate.format(dateFormat),
                    y       : counter,
                    type    : key,
                    sector  : sector,
                });
            });
        });
    });

    callback(null, { data : data, sectors : sampleSect, startDate : startDate.subtract(1, 'months').format(dateFormat), endDate : endDate.format(dateFormat) });
}
