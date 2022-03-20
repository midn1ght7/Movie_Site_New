//TMDB
const API_KEY = 'api_key=8cc7b14fbd7e6745695ae4dd54391660';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const BACKDROP_URL = 'https://image.tmdb.org/t/p/w1920_and_h800_multi_faces';
const SEARCH_URL = BASE_URL+'/search/movie?'+API_KEY;
const LANG = '&language=en-US';

const POPULAR = BASE_URL+ '/discover/tv?'+API_KEY+'&sort_by=popularity.desc&';
const EXAMPLE = BASE_URL + '/movie/550?'+API_KEY+'&query=';

function downloadImage(path,tmdb_id,name)
{
    fetch(path).then(response => response.blob()).then(blob => 
        {
            const file = new File([blob], 'image.jpg', {type: blob.type});
            var a = document.createElement('a');
            a.download = `${tmdb_id}`+`${name}`+".jpg";
            a.href = window.URL.createObjectURL(file);
            a.click();
        })
        .catch(error => {
            console.error('There was an error!', error);
        });
}

function getImages(){

    for(let i=0; i<10000; i++)
    {
        fetch(BASE_URL+'/movie/'+i+'?'+API_KEY+LANG).then(response => response.json()).then(data =>
        {
            if(data) 
            {
                if(data.poster_path)
                {
                    downloadImage(IMG_URL+data.poster_path, data.id, "_p");
                }
                if(data.backdrop_path){
                    downloadImage(BACKDROP_URL+data.backdrop_path, data.id, "_b");
                }
            }
        })
    }
}
getImages();