function showLinks() {
  let links = document.getElementsByClassName('links')[0];
  
  if (links.classList.contains('hidden')) {
    links.classList.remove('hidden');
  } else {
    links.classList.toggle('hidden');
  }
}
