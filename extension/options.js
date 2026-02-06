const defaults = {
  snapRadius: 180,
  releaseRadius: 220,
  hysteresisMargin: 40,
};

const byId = (id) => document.getElementById(id);

const snapRadius = byId("snapRadius");
const releaseRadius = byId("releaseRadius");
const hysteresisMargin = byId("hysteresisMargin");

const snapRadiusValue = byId("snapRadiusValue");
const releaseRadiusValue = byId("releaseRadiusValue");
const hysteresisMarginValue = byId("hysteresisMarginValue");

const saveButton = byId("save");
const status = byId("status");

const renderValue = () => {
  snapRadiusValue.textContent = `${snapRadius.value}px`;
  releaseRadiusValue.textContent = `${releaseRadius.value}px`;
  hysteresisMarginValue.textContent = `${hysteresisMargin.value}px`;
};

const load = () => {
  chrome.storage.sync.get(defaults, (settings) => {
    snapRadius.value = settings.snapRadius;
    releaseRadius.value = settings.releaseRadius;
    hysteresisMargin.value = settings.hysteresisMargin;
    renderValue();
  });
};

const save = () => {
  const settings = {
    snapRadius: Number(snapRadius.value),
    releaseRadius: Number(releaseRadius.value),
    hysteresisMargin: Number(hysteresisMargin.value),
  };

  chrome.storage.sync.set(settings, () => {
    status.textContent = "Saved";
    setTimeout(() => {
      status.textContent = "";
    }, 1000);
  });
};

[snapRadius, releaseRadius, hysteresisMargin].forEach((input) => {
  input.addEventListener("input", renderValue);
});

saveButton.addEventListener("click", save);

document.addEventListener("DOMContentLoaded", load);
