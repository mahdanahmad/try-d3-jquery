window.onload   = function() {
    randomScatter((error, result) => {
        createScatter(result);
    });
};
