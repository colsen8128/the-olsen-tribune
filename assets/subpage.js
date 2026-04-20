function initSubpage(config) {
  // Header date
  var dateEl = document.getElementById('headerDate');
  if (dateEl) {
    dateEl.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  }

  var PER_PAGE = 10;
  var currentPage = 1;

  // Filter and sort articles for this category using the lightweight index
  var articles = ARTICLE_INDEX
    .filter(function (a) { return a.category === config.category; })
    .sort(function (a, b) { return new Date(b.date) - new Date(a.date); });

  var totalPages = Math.max(1, Math.ceil(articles.length / PER_PAGE));

  // Render section header
  var headerEl = document.getElementById('subpageHeader');
  if (headerEl) {
    var title = document.createElement('h1');
    title.className = 'subpage-title';
    title.textContent = config.category;
    headerEl.appendChild(title);
    var desc = document.createElement('p');
    desc.className = 'subpage-desc';
    desc.textContent = config.description;
    headerEl.appendChild(desc);
  }

  var listEl   = document.getElementById('subpageList');
  var countEl  = document.getElementById('subpageCount');
  var pagingEl = document.getElementById('subpagePagination');

  // Click on article row → open in main reader
  if (listEl) {
    listEl.addEventListener('click', function (e) {
      var row = e.target.closest('[data-slug]');
      if (row) {
        window.location.href = 'index.html#' + row.getAttribute('data-slug');
      }
    });
  }

  function render() {
    var start = (currentPage - 1) * PER_PAGE;
    var end   = Math.min(start + PER_PAGE, articles.length);
    var page  = articles.slice(start, end);

    // Count label
    if (countEl) {
      if (articles.length === 0) {
        countEl.textContent = '';
      } else {
        countEl.textContent =
          'Showing ' + (start + 1) + '\u2013' + end + ' of ' + articles.length + ' articles';
      }
    }

    // Article list
    if (listEl) {
      listEl.innerHTML = '';

      if (articles.length === 0) {
        var empty = document.createElement('p');
        empty.className = 'subpage-empty';
        empty.textContent =
          'No articles have been published in this category yet. Check back soon.';
        listEl.appendChild(empty);
      } else {
        page.forEach(function (a) {
          var row = document.createElement('div');
          row.className = 'story-row';
          row.setAttribute('data-slug', a.slug);

          var meta = document.createElement('div');
          meta.className = 'story-meta';
          var catSpan = document.createElement('span');
          catSpan.className = 'cat';
          catSpan.textContent = a.category;
          var dateSpan = document.createElement('span');
          dateSpan.textContent = a.date;
          var readSpan = document.createElement('span');
          readSpan.textContent = a.readTime;
          meta.appendChild(catSpan);
          meta.appendChild(dateSpan);
          meta.appendChild(readSpan);

          var headline = document.createElement('div');
          headline.className = 'story-headline';
          headline.textContent = a.headline;

          var excerpt = document.createElement('div');
          excerpt.className = 'story-excerpt';
          excerpt.textContent = a.deck;

          row.appendChild(meta);
          row.appendChild(headline);
          row.appendChild(excerpt);
          listEl.appendChild(row);
        });
      }
    }

    // Pagination
    if (pagingEl) {
      pagingEl.innerHTML = '';
      if (totalPages > 1) {
        var prevBtn = document.createElement('button');
        prevBtn.className = 'pagination-btn';
        prevBtn.textContent = '\u2190 Previous';
        prevBtn.disabled = currentPage === 1;
        prevBtn.addEventListener('click', function () {
          if (currentPage > 1) { currentPage--; render(); window.scrollTo(0, 0); }
        });

        var info = document.createElement('span');
        info.className = 'pagination-info';
        info.textContent = 'Page ' + currentPage + ' of ' + totalPages;

        var nextBtn = document.createElement('button');
        nextBtn.className = 'pagination-btn';
        nextBtn.textContent = 'Next \u2192';
        nextBtn.disabled = currentPage === totalPages;
        nextBtn.addEventListener('click', function () {
          if (currentPage < totalPages) { currentPage++; render(); window.scrollTo(0, 0); }
        });

        pagingEl.appendChild(prevBtn);
        pagingEl.appendChild(info);
        pagingEl.appendChild(nextBtn);
      }
    }
  }

  render();
}

// Auto-initialize from data attributes on <main data-category="..." data-description="...">
document.addEventListener('DOMContentLoaded', function () {
  var mainEl = document.querySelector('main[data-category]');
  if (mainEl) {
    initSubpage({
      category:    mainEl.getAttribute('data-category'),
      description: mainEl.getAttribute('data-description')
    });
  }
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function () {});
}
