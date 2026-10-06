// Obsidian-style collapsible headings for the published site. Not managed by
// GitHub Publish; deploy.yml copies it into the built site and adds a
// <script data-persist> tag to every page.
(function () {
  if (window.__collapseHeadings) return
  window.__collapseHeadings = true

  var HEADING = /^H([1-6])$/
  var ARROW =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="6 9 12 15 18 9"></polyline></svg>'

  function level(el) {
    var m = HEADING.exec(el.tagName)
    return m ? Number(m[1]) : 0
  }

  // Hide everything under a collapsed heading, up to the next heading of the
  // same or higher level. Collapsed subheadings stay collapsed when a parent
  // is expanded.
  function refresh(article) {
    var collapsed = []
    Array.prototype.forEach.call(article.children, function (el) {
      var l = level(el)
      if (l) {
        while (collapsed.length && collapsed[collapsed.length - 1] >= l) collapsed.pop()
      }
      el.classList.toggle("heading-collapsed-content", collapsed.length > 0)
      if (l && el.classList.contains("heading-collapsed")) collapsed.push(l)
    })
  }

  function setCollapsed(heading, collapsed) {
    heading.classList.toggle("heading-collapsed", collapsed)
    var button = heading.querySelector(":scope > .heading-fold")
    button.setAttribute("aria-expanded", String(!collapsed))
    button.setAttribute("aria-label", collapsed ? "Expand section" : "Collapse section")
  }

  // Headings and their paragraphs are siblings, but not always direct children
  // of <article> (the theme wraps them in a div, and embeds have their own
  // container), so each heading's parent is the container it folds within.
  function setup() {
    var containers = new Set()
    document.querySelectorAll("article :is(h1, h2, h3, h4, h5, h6)").forEach(function (heading) {
      if (heading.closest(".popover") || heading.querySelector(":scope > .heading-fold")) return
      var article = heading.parentElement
      heading.classList.add("heading-foldable")
      var button = document.createElement("button")
      button.type = "button"
      button.className = "heading-fold"
      button.innerHTML = ARROW
      button.addEventListener("click", function (e) {
        e.preventDefault()
        e.stopPropagation()
        setCollapsed(heading, !heading.classList.contains("heading-collapsed"))
        refresh(article)
      })
      heading.insertBefore(button, heading.firstChild)
      // Headings marked with <span class="collapsed"></span> in the note start
      // collapsed.
      setCollapsed(heading, !!heading.querySelector(".collapsed"))
      containers.add(article)
    })
    containers.forEach(refresh)
    reveal(location.hash)
  }

  // Expand any collapsed headings that hide the element a #link points to.
  function reveal(hash) {
    if (!hash || hash.length < 2) return
    var target = document.getElementById(decodeURIComponent(hash.slice(1)))
    if (!target) return
    var el = target.closest(".heading-collapsed-content")
    if (!el) return
    var article = el.parentElement
    // Walk back through the headings this element sits under.
    var l = level(el) || 7
    for (var prev = el.previousElementSibling; prev && l > 1; prev = prev.previousElementSibling) {
      var pl = level(prev)
      if (!pl || pl >= l) continue
      l = pl
      if (prev.classList.contains("heading-collapsed")) setCollapsed(prev, false)
    }
    refresh(article)
  }

  // Runs before Quartz's router scrolls to a #link (capture phase).
  window.addEventListener(
    "click",
    function (e) {
      var a = e.target.closest && e.target.closest("a[href*='#']")
      if (!a) return
      var url = new URL(a.href, location.href)
      if (url.pathname === location.pathname) reveal(url.hash)
    },
    true,
  )
  window.addEventListener("hashchange", function () {
    reveal(location.hash)
  })
  document.addEventListener("nav", setup)
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setup)
  } else {
    setup()
  }
})()
