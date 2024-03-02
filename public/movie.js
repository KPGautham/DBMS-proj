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



// Add a smooth scrolling effect to the page
document.addEventListener("DOMContentLoaded", function () {
    const links = document.querySelectorAll("a[href^='#']");
    links.forEach((link) => {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        const href = this.getAttribute("href");
        const targetElement = document.querySelector(href);
        const targetPosition =
          targetElement.getBoundingClientRect().top + window.pageYOffset;
        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      });
    });
  });
  
  // Add a hover effect to the buttons
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.addEventListener("mouseover", function () {
      button.style.backgroundColor = "#3e8e41";
    });
    button.addEventListener("mouseout", function () {
      button.style.backgroundColor = "#4CAF50";
    });
  });
  
  // Add a form validation function to the review form
  const form = document.querySelector("#review form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const reviewInput = document.querySelector("#review input[type='text']");
    const scoreInput = document.querySelector("#review input[type='number']");
    if (!reviewInput.value || !scoreInput.value) {
      alert("Please fill in all fields");
      return;
    }
    if (scoreInput.value < 1 || scoreInput.value > 10) {
      alert("Please enter a valid score (1-10)");
      return;
    }
    form.submit();
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