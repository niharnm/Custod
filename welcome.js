// welcome.js — first-run onboarding. Opened in a tab right after install so the
// user is asked to sign in immediately (Grammarly-style). It drives the same
// background auth handlers the popup uses, so a sign-in here logs the whole
// extension in.

let mode = "sign_in";

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("authForm").addEventListener("submit", onSubmit);
  document.getElementById("googleSignIn").addEventListener("click", onGoogle);
  document.getElementById("toggle").addEventListener("click", onToggle);
  document.getElementById("skip").addEventListener("click", onSkip);
  document.getElementById("close").addEventListener("click", () => window.close());

  // If the user already has a session (e.g. signed in via the website bridge or
  // the macOS app on the same account), skip straight to the success state.
  chrome.runtime.sendMessage({ type: "get_auth_state" }, (res) => {
    if (!chrome.runtime.lastError && res && res.signedIn) {
      showDone(res.email, true);
    }
  });
});

function showError(message) {
  const el = document.getElementById("error");
  el.textContent = message || "";
  el.classList.toggle("hidden", !message);
}

function onToggle() {
  mode = mode === "sign_in" ? "sign_up" : "sign_in";
  document.getElementById("title").textContent =
    mode === "sign_up" ? "Create your account" : "Sign in to start";
  document.getElementById("submit").textContent = mode === "sign_up" ? "Sign up" : "Sign in";
  document.getElementById("toggle").textContent =
    mode === "sign_up" ? "Already have an account? Sign in" : "Need an account? Create one";
  document.getElementById("password").autocomplete =
    mode === "sign_up" ? "new-password" : "current-password";
  showError("");
}

function onSubmit(e) {
  e.preventDefault();
  showError("");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const submit = document.getElementById("submit");
  submit.disabled = true;

  const type = mode === "sign_up" ? "sign_up" : "sign_in";
  chrome.runtime.sendMessage({ type, email, password }, (result) => {
    submit.disabled = false;
    if (chrome.runtime.lastError || !result) {
      showError("Could not reach the extension background.");
      return;
    }
    if (!result.ok) {
      showError(result.error || "Authentication failed.");
      return;
    }
    showDone(result.email, true);
  });
}

function onGoogle() {
  showError("");
  const btn = document.getElementById("googleSignIn");
  btn.disabled = true;
  chrome.runtime.sendMessage({ type: "sign_in_google" }, (result) => {
    btn.disabled = false;
    if (chrome.runtime.lastError || !result) {
      showError("Could not reach the extension background.");
      return;
    }
    if (!result.ok) {
      showError(result.error || "Google sign-in failed.");
      return;
    }
    showDone(result.email, true);
  });
}

// "Continue without an account" — Custod still scores your focus locally; it
// just won't sync until you sign in. We mark onboarding seen so install doesn't
// reopen this tab, then drop the user into the same success screen.
function onSkip() {
  chrome.runtime.sendMessage({ type: "skip_onboarding" }, () => {
    showDone(null, false);
  });
}

function showDone(email, signedIn) {
  document.getElementById("signinStep").classList.add("hidden");
  document.getElementById("doneStep").classList.remove("hidden");
  const msg = document.getElementById("doneMsg");
  if (signedIn) {
    msg.textContent = email
      ? `Signed in as ${email}. Custod is watching your focus and syncing to your account.`
      : "Signed in. Custod is watching your focus and syncing to your account.";
  } else {
    msg.textContent =
      "Custod is scoring your focus locally. Sign in any time from the toolbar icon to sync across your devices.";
  }
}
