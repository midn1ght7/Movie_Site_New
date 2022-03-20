window.addEventListener('load', function() {
    //SEARCH BUTTON
    var search_form = document.getElementById("form-search");
    search_form.addEventListener('submit', e => {
        e.preventDefault();
        const searchTerm = document.getElementById("search-input").value;
        if (searchTerm) {
            fetch(`/search/${searchTerm}`,
                {
                    method: 'GET',
                });
            window.location = `/search/${searchTerm}`;
        }
    })
});