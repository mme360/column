document.addEventListener('DOMContentLoaded', () => {
  const builderButton = document.getElementById('buildReplacementQuery');
  builderButton?.addEventListener('click', () => {
    const parts = [
      document.getElementById('builderBrand')?.value,
      document.getElementById('builderPhase')?.value,
      document.getElementById('builderParticle')?.value,
      document.getElementById('builderPore')?.value,
      document.getElementById('builderId')?.value,
      document.getElementById('builderLength')?.value
    ].filter(Boolean);
    const input = document.getElementById('replacementInput');
    if (input) {
      input.value = parts.join(' ');
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });
});
