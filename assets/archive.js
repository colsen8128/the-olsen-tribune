(function () {
  // Header date
  var dateEl = document.getElementById('headerDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  var searchInput    = document.getElementById('archiveSearch');
  var categorySelect = document.getElementById('archiveCategory');
  var listEl         = document.getElementById('archiveList');
  var countEl        = document.getElementById('archiveResultsCount');

  // Populate category dropdown from the lightweight index
  var categories = [];
  ARTICLE_INDEX.forEach(function (a) {
    if (categories.indexOf(a.category) === -1) categories.push(a.category);
  });
  categories.sort().forEach(function (cat) {
    var opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    categorySelect.appendChild(opt);
  });

  function renderList() {
    var q   = searchInput.value.toLowerCase().trim();
    var cat = categorySelect.value;

    var filtered = ARTICLE_INDEX.filter(function (a) {
      var matchCat = !cat || a.category === cat;
      var matchQ   = !q ||
        a.headline.toLowerCase().indexOf(q) !== -1 ||
        a.deck.toLowerCase().indexOf(q) !== -1 ||
        a.category.toLowerCase().indexOf(q) !== -1;
      return matchCat && matchQ;
    });

    listEl.innerHTML = '';

    var total = ARTICLE_INDEX.length;
    countEl.textContent = filtered.length === total
      ? total + ' articles'
      : filtered.length + ' of ' + total + ' articles';

    if (filtered.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'archive-empty';
      empty.textContent = 'No articles match your search.';
      listEl.appendChild(empty);
      return;
    }

    filtered.forEach(function (a) {
      var item = document.createElement('div');
      item.className = 'archive-item';
      item.setAttribute('data-slug', a.slug);

      var meta = document.createElement('div');
      meta.className = 'archive-meta';

      var catSpan = document.createElement('span');
      catSpan.className = 'archive-cat';
      catSpan.textContent = a.category;

      var dateSpan = document.createElement('span');
      dateSpan.textContent = a.date;

      var readSpan = document.createElement('span');
      readSpan.textContent = a.readTime;

      meta.appendChild(catSpan);
      meta.appendChild(dateSpan);
      meta.appendChild(readSpan);

      var title = document.createElement('div');
      title.className = 'archive-title';
      title.textContent = a.headline;

      var excerpt = document.createElement('div');
      excerpt.className = 'archive-excerpt';
      excerpt.textContent = a.deck;

      item.appendChild(meta);
      item.appendChild(title);
      item.appendChild(excerpt);
      listEl.appendChild(item);
    });
  }

  // Click on an archive item navigates to index.html#slug
  listEl.addEventListener('click', function (e) {
    var item = e.target.closest('[data-slug]');
    if (item) {
      window.location.href = 'index.html#' + item.getAttribute('data-slug');
    }
  });

  searchInput.addEventListener('input', renderList);
  categorySelect.addEventListener('change', renderList);

  renderList();
}());
