var crsr = document.querySelector("#cursor");
var blur = document.querySelector("#cursor-blur");

document.addEventListener("mousemove", function (dets) {
  crsr.style.left = dets.x + "px";
  crsr.style.top = dets.y + "px";
  blur.style.left = dets.x - 250 + "px";
  blur.style.top = dets.y - 250 + "px";
});
var h4all = document.querySelectorAll("#nav h4");
h4all.forEach(function (elem) {
  elem.addEventListener("mouseenter", function () {
    crsr.style.scale = 3;
    crsr.style.border = "1px solid #fff";
    crsr.style.backgroundColor = "transparent";
  });
  elem.addEventListener("mouseleave", function () {
    crsr.style.scale = 1;
    crsr.style.border = "0px solid #95C11E";
    crsr.style.backgroundColor = "#95C11E";
  });
});
// Get all movie elements
const movies = document.querySelectorAll('#movie');

// Add event listener to each movie element
movies.forEach(movie => {
  movie.addEventListener('click', () => {
    // Get movie ID from the clicked movie element
    const movieId = movie.querySelector('a').getAttribute('href').split('/')[2];

    // Redirect to the movie details page with the movie ID as a parameter
    window.location.href = `/movie/${movieId}`;
  });
});

// Get the completed button elements
const completedButtons = document.querySelectorAll('#form button');

// Add event listener to each completed button element
completedButtons.forEach(button => {
  button.addEventListener('click', (event) => {
    // Prevent the default form submission behavior
    event.preventDefault();

    // Get the movie ID from the completed button element
    const movieId = event.target.closest('form').getAttribute('action').split('/')[2];

    // Send a DELETE request to the server to remove the movie from the watchlist
    fetch(`/finished/${movieId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      // If the request was successful, remove the movie element from the page
      if (response.ok) {
        event.target.closest('#movie').remove();
      } else {
        throw new Error('Failed to remove movie from watchlist.');
      }
    })
    .catch(error => {
      // Display an error message if there was a problem removing the movie from the watchlist
      console.error(error);
      alert('Failed to remove movie from watchlist. Please try again later.');
    });
  });
});

// Get the search input element
const searchInput = document.querySelector('#search input[type="text"]');

// Add event listener to the search input element
searchInput.addEventListener('input', () => {
  // Get the search query from the input element
  const searchQuery = searchInput.value.trim();

  // If the search query is not empty, redirect to the search results page
  if (searchQuery) {
    window.location.href = `/search?query=${searchQuery}`;
  }
});
gsap.to("#nav", {
    backgroundColor: "#000",
    duration: 0.5,
    height: "110px",
    scrollTrigger: {
      trigger: "#nav",
      scroller: "body",
      // markers:true,
      start: "top -10%",
      end: "top -11%",
      scrub: 1,
    },
  });