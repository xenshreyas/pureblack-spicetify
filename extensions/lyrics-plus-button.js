// Makes Spotify's own lyrics (mic) button in the playbar open Lyrics Plus.
(function lyricsPlusButton() {
  if (!Spicetify.Platform?.History || !Spicetify.LocalStorage) {
    setTimeout(lyricsPlusButton, 300);
    return;
  }

  // Lyrics Plus's "Playbar button" option hides Spotify's button, but its
  // replacement doesn't render on this Spotify version, so keep it off.
  const OPTION = "lyrics-plus:visual:playbar-button";
  if (Spicetify.LocalStorage.get(OPTION) !== "false") {
    Spicetify.LocalStorage.set(OPTION, "false");
    window.dispatchEvent(new CustomEvent("lyrics-plus", { detail: { name: "playbar-button", value: false } }));
  }

  const BUTTON = '[data-testid="now-playing-bar"] [data-testid="lyrics-button"]';
  const history = Spicetify.Platform.History;

  document.addEventListener(
    "click",
    (event) => {
      if (!event.target.closest?.(BUTTON)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (history.location.pathname === "/lyrics-plus") history.goBack();
      else history.push("/lyrics-plus");
    },
    true
  );

  // Spotify disables the button when it has no lyrics of its own, but Lyrics
  // Plus may still find some through Musixmatch or LRCLIB.
  let queued = false;
  const enableButton = () => {
    queued = false;
    for (const button of document.querySelectorAll(`${BUTTON}[disabled]`)) button.removeAttribute("disabled");
  };
  new MutationObserver(() => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(enableButton);
    }
  }).observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["disabled"] });
  enableButton();
})();
