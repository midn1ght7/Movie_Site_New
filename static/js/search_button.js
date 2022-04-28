var type = "Title";
var type_locale = gettext("title_");

function hideAfterClicking(){
    var dropdowns = document.getElementsByClassName("search-dropdown-content");
    var i;
    for (i = 0; i < dropdowns.length; i++) {
      var openDropdown = dropdowns[i];
      if (openDropdown.classList.contains('show')) {
        openDropdown.classList.remove('show');
      }
    }
}

window.addEventListener('load', function() {
    //SEARCH DROPDOWN
    var searchDropBtn = document.getElementById("search-dropdown-btn")
    searchDropBtn.innerHTML=`${type_locale} <i class="fa fa-caret-down"></i>`;
    searchDropBtn.onclick=function(){document.getElementById("search-dropdown").classList.toggle("show");}


    document.getElementById("drop-title").onclick = function(){
        type = "Title";
        type_locale = gettext("title_");
        searchDropBtn.innerHTML=`${type_locale} <i class="fa fa-caret-down"></i>`;
        hideAfterClicking();
    }
    document.getElementById("drop-keyword").onclick = function(){
        type = "Keyword";
        type_locale = gettext("keyword");
        searchDropBtn.innerHTML=`${type_locale} <i class="fa fa-caret-down"></i>`; 
        hideAfterClicking();
    }
    document.getElementById("drop-director").onclick = function(){
        type = "Director";
        type_locale = gettext("director");
        searchDropBtn.innerHTML=`${type_locale} <i class="fa fa-caret-down"></i>`; 
        hideAfterClicking();
    }
    
    //SEARCH BUTTON
    var search_form = document.getElementById("form-search");
    search_form.addEventListener('submit', e => {
        e.preventDefault();
        const searchTerm = document.getElementById("search-input").value;
        if (searchTerm) {
            if (type == "Title"){
                window.location = `/search/${searchTerm}`;
            }
            if (type == "Keyword"){
                window.location = `/keyword/${searchTerm}`;
            }
            if (type == "Director"){
                window.location = `/director/${searchTerm}`;
            }
        }
    })
});

// Close the dropdown menu if the user clicks outside of it
window.onclick = function(event) {
    if (!event.target.matches('.search-dropdown-btn')) {
      var dropdowns = document.getElementsByClassName("search-dropdown-content");
      var i;
      for (i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
          openDropdown.classList.remove('show');
        }
      }
    }
}