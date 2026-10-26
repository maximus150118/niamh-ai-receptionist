/* Email popup: progressive enhancement for mailto links (no libraries, no tracking). */
(function () {
  'use strict';
  var EMAIL = 'andrejsjermakovics888@gmail.com';
  var DEFAULT_SUBJECT = 'Niamh AI receptionist enquiry';
  var BODY = "Hi Andrejs,\n\nI'd like to know more about Niamh for our agency.\n\nAgency name:\nPhone:\n";
  if (!document.querySelector || !window.addEventListener) return;

  var dlg, emailEl, copyBtn, gmailA, outlookA, mailtoA, lastFocus, copyTimer;
  var canModal = typeof HTMLDialogElement === 'function' &&
    typeof HTMLDialogElement.prototype.showModal === 'function';

  function build() {
    dlg = document.createElement('dialog');
    dlg.className = 'mail-modal';
    dlg.id = 'email-modal';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'mail-modal-title');
    dlg.setAttribute('aria-describedby', 'mail-modal-desc');
    dlg.innerHTML =
      '<div class="mail-card">' +
        '<button type="button" class="mail-close" aria-label="Close">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>' +
        '</button>' +
        '<h2 id="mail-modal-title">Email Andrejs</h2>' +
        '<p id="mail-modal-desc" class="mail-sub">Pick the easiest way:</p>' +
        '<div class="mail-copy">' +
          '<span class="mail-addr"></span>' +
          '<button type="button" class="btn btn-ghost btn-sm mail-copy-btn" aria-live="polite">Copy</button>' +
        '</div>' +
        '<div class="mail-actions">' +
          '<a class="btn btn-primary mail-gmail" target="_blank" rel="noopener">Open in Gmail</a>' +
          '<a class="btn btn-ghost mail-outlook" target="_blank" rel="noopener">Open in Outlook</a>' +
        '</div>' +
        '<p class="mail-default"><a class="mail-mailto">Use my default email app</a></p>' +
      '</div>';
    document.body.appendChild(dlg);
    emailEl = dlg.querySelector('.mail-addr');
    // Allow a clean line break before the @ on narrow screens.
    var at = EMAIL.indexOf('@');
    emailEl.appendChild(document.createTextNode(EMAIL.slice(0, at)));
    emailEl.appendChild(document.createElement('wbr'));
    emailEl.appendChild(document.createTextNode(EMAIL.slice(at)));
    copyBtn = dlg.querySelector('.mail-copy-btn');
    gmailA = dlg.querySelector('.mail-gmail');
    outlookA = dlg.querySelector('.mail-outlook');
    mailtoA = dlg.querySelector('.mail-mailto');

    dlg.querySelector('.mail-close').addEventListener('click', close);
    copyBtn.addEventListener('click', copy);
    // Backdrop click: the <dialog> itself is the backdrop area (card is a child).
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
    // Esc (native dialog fires 'cancel'; handle keydown too for the fallback path).
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); }
      else if (e.key === 'Tab' && !canModal) trap(e);
    });
    // Close after choosing an option so the page is clean on return.
    [gmailA, outlookA, mailtoA].forEach(function (a) {
      a.addEventListener('click', function () { setTimeout(close, 0); });
    });
  }

  function trap(e) {
    var f = dlg.querySelectorAll('button, a[href]');
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  function subjectOf(href) {
    var m = /[?&]subject=([^&]*)/i.exec(href || '');
    if (!m) return DEFAULT_SUBJECT;
    try { return decodeURIComponent(m[1].replace(/\+/g, ' ')) || DEFAULT_SUBJECT; }
    catch (err) { return DEFAULT_SUBJECT; }
  }

  function open(href) {
    if (!dlg) build();
    var subject = subjectOf(href);
    var to = encodeURIComponent(EMAIL), su = encodeURIComponent(subject), bo = encodeURIComponent(BODY);
    gmailA.href = 'https://mail.google.com/mail/?view=cm&fs=1&to=' + to + '&su=' + su + '&body=' + bo;
    outlookA.href = 'https://outlook.live.com/mail/0/deeplink/compose?to=' + to + '&subject=' + su + '&body=' + bo;
    mailtoA.href = 'mailto:' + EMAIL + '?subject=' + su + '&body=' + bo;
    resetCopy();
    lastFocus = document.activeElement;
    if (canModal) dlg.showModal(); else { dlg.setAttribute('open', ''); dlg.classList.add('mail-fallback'); }
    document.documentElement.classList.add('mail-open');
    showChat(false);
    copyBtn.focus();
  }

  function close() {
    if (!dlg || !dlg.hasAttribute('open')) return;
    if (canModal) dlg.close(); else dlg.removeAttribute('open');
    document.documentElement.classList.remove('mail-open');
    showChat(true);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  // Chat widget (lead-assistant widget.js): hidden while this popup is open.
  // Its host element has an inline "display:block !important", which a stylesheet
  // cannot override, so the inline value is switched here. No widget on the page: nothing happens.
  function showChat(show) {
    var chat = document.querySelector('lead-assistant-widget');
    if (chat) chat.style.setProperty('display', show ? 'block' : 'none', 'important');
  }

  function resetCopy() {
    clearTimeout(copyTimer);
    copyBtn.textContent = 'Copy';
    copyBtn.classList.remove('is-copied');
  }

  function copied() {
    copyBtn.textContent = 'Copied \u2713';
    copyBtn.classList.add('is-copied');
    clearTimeout(copyTimer);
    copyTimer = setTimeout(resetCopy, 2000);
  }

  function legacyCopy() {
    var ok = false;
    var ta = document.createElement('textarea');
    ta.value = EMAIL;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed'; ta.style.top = '0'; ta.style.left = '0'; ta.style.opacity = '0';
    dlg.appendChild(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    dlg.removeChild(ta);
    copyBtn.focus();
    if (ok) copied(); else selectAddress();
  }

  function selectAddress() {
    // Last resort: select the address so the visitor can copy it manually.
    var r = document.createRange(); r.selectNodeContents(emailEl);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
    copyBtn.textContent = 'Press Ctrl+C';
  }

  function copy() {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(EMAIL).then(copied, legacyCopy);
    } else {
      legacyCopy();
    }
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href^="mailto:"]');
    if (!a || (dlg && dlg.contains(a))) return;
    e.preventDefault();
    open(a.getAttribute('href'));
  });
})();
