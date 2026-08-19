/**
 * Gestion des formulaires CIMBBA via Web3Forms (https://web3forms.com)
 * Remplace validate.js (prévu pour un backend PHP) car le site est
 * déployé de façon statique et les emails passent par un service tiers.
 */
(function () {
  "use strict";

  let forms = document.querySelectorAll('.php-email-form');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      let action = form.getAttribute('action');
      if (!action) {
        displayError(form, "L'adresse d'envoi du formulaire n'est pas configurée.");
        return;
      }

      let accessKey = form.querySelector('input[name="access_key"]');
      if (!accessKey || !accessKey.value || accessKey.value.indexOf('REMPLACER_PAR') === 0) {
        displayError(form, "Le formulaire n'est pas encore configuré (clé Web3Forms manquante).");
        return;
      }

      form.querySelector('.loading').classList.add('d-block');
      form.querySelector('.error-message').classList.remove('d-block');
      form.querySelector('.sent-message').classList.remove('d-block');

      let formData = new FormData(form);

      fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          form.querySelector('.loading').classList.remove('d-block');
          if (result.ok && result.data.success) {
            form.querySelector('.sent-message').classList.add('d-block');
            form.reset();
          } else {
            throw new Error(result.data.message || "L'envoi a échoué. Veuillez réessayer plus tard.");
          }
        })
        .catch(function (error) {
          displayError(form, error.message || error);
        });
    });
  });

  function displayError(form, error) {
    form.querySelector('.loading').classList.remove('d-block');
    form.querySelector('.error-message').innerHTML = error;
    form.querySelector('.error-message').classList.add('d-block');
  }
})();
