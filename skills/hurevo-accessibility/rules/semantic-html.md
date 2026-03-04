---
title: Semantic HTML
impact: high
tags: [accessibility, html, semantics, screen-readers]
---

## Why

- Screen readers rely on semantic elements to announce document structure — a page built entirely of `<div>` tags sounds like an undifferentiated wall of text
- Heading levels skipped or used for visual sizing cause screen reader users to miss navigation landmarks and content hierarchy
- `<input>` elements without associated `<label>` tags are announced only by their type, leaving users unable to know what to type

## Pattern

**Bad** — divs for everything, missing labels, unlabelled images:

```html
<!-- No landmark structure — screen reader has no context -->
<div class="nav">
  <div class="nav-item" onclick="navigate('home')">Home</div>
  <div class="nav-item" onclick="navigate('reports')">Reports</div>
</div>

<div class="main">
  <div class="title">User Management</div>    <!-- not a heading -->
  <div class="subtitle">Active Users</div>   <!-- skips h2, no hierarchy -->

  <!-- Input with no label — announced as "text field" only -->
  <input type="text" placeholder="Search users..." />

  <!-- Image with no alt — announced as filename -->
  <img src="/icons/user-avatar.png" />
</div>
```

**Good** — semantic elements, labelled inputs, meaningful alt text:

```html
<nav aria-label="Main navigation">
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/reports">Reports</a></li>
  </ul>
</nav>

<main>
  <h1>User Management</h1>

  <section aria-labelledby="active-users-heading">
    <h2 id="active-users-heading">Active Users</h2>

    <!-- Visible label associated with input -->
    <label for="user-search">Search users</label>
    <input type="search" id="user-search" name="user-search" />

    <!-- Meaningful alt describing the image content -->
    <img src="/avatars/user-42.png" alt="Profile photo of Sarah Chen" />

    <!-- Decorative image — empty alt so screen reader skips it -->
    <img src="/icons/decoration.svg" alt="" role="presentation" />
  </section>
</main>

<footer>
  <p>© 2026 Hurevo</p>
</footer>
```

## Rules

1. Use semantic HTML elements (`<nav>`, `<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<button>`) — never `<div>` or `<span>` for structural or interactive elements.
2. Every page has exactly one `<h1>`; heading levels are hierarchical and must not skip (h1 → h2 → h3, never h1 → h3).
3. Every `<input>` and `<select>` must have an associated `<label for="...">` — placeholder text is not a label.
4. Every `<img>` has a meaningful `alt` attribute that describes the image; decorative images use `alt=""`.
5. Data tables must use `<th scope="col|row">` and a `<caption>` — never use a table for visual layout.
